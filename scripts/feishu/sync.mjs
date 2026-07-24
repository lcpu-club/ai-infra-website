import { createHash } from 'node:crypto'
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile
} from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import {
  createFeishuClient,
  downloadDocumentMedia,
  fetchWikiMarkdown,
  listCalendarEvents
} from './client.mjs'
import { readSyncConfig } from './config.mjs'
import { loadLocalEnv, requireFeishuCredentials } from './env.mjs'
import { normalizeFeishuMarkdown } from './markdown.mjs'
import { renderSessionPage } from './render.mjs'
import { dateRangeToUnixSeconds, eventToPublicData } from './time.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '../..')
const dryRun = process.argv.includes('--dry-run')
const snapshotTarget = path.join(
  repoRoot,
  'docs/.vitepress/data/generated/feishu.json'
)

await loadLocalEnv(repoRoot)
const credentials = requireFeishuCredentials()
const config = await readSyncConfig(repoRoot)
const client = createFeishuClient(credentials)
const stagingRoot = await mkdtemp(path.join(repoRoot, '.feishu-sync-'))
const stagedPages = path.join(stagingRoot, 'sessions')
const stagedAssets = path.join(stagingRoot, 'public/feishu')
const stagedSnapshot = path.join(stagingRoot, 'feishu.json')
const operations = []

try {
  const snapshot = await readExistingSnapshot()
  const calendarEvents = await fetchConfiguredCalendar()
  applyCalendarData(snapshot, calendarEvents)

  const wikiRoutes = new Map(
    config.sessions
      .filter(({ wikiNodeToken }) => wikiNodeToken)
      .map(({ id, wikiNodeToken }) => [
        wikiNodeToken,
        `/sessions/${id}`
      ])
  )

  for (const session of config.sessions) {
    if (!session.wikiNodeToken) continue
    await stageWikiSession({ session, snapshot, wikiRoutes })
  }

  await mkdir(path.dirname(stagedSnapshot), { recursive: true })
  await writeFile(stagedSnapshot, stableJson(snapshot), 'utf8')

  operations.push({
    staged: stagedSnapshot,
    target: snapshotTarget,
    label: 'generated Feishu data'
  })

  const changedOperations = []
  for (const operation of operations) {
    if (!(await pathsEqual(operation.staged, operation.target))) {
      changedOperations.push(operation)
    }
  }

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          calendar: config.calendarId
            ? { id: config.calendarId, eventCount: calendarEvents.length }
            : { skipped: true },
          documents: config.sessions.filter(({ wikiNodeToken }) => wikiNodeToken)
            .length,
          changed: changedOperations.map(({ label }) => label)
        },
        null,
        2
      )
    )
  } else {
    await commitOperations(changedOperations)
    console.log(
      changedOperations.length > 0
        ? `Feishu sync updated ${changedOperations.length} generated target(s).`
        : 'Feishu sync is already up to date.'
    )
  }
} finally {
  await rm(stagingRoot, { recursive: true, force: true })
}

async function readExistingSnapshot() {
  try {
    const snapshot = JSON.parse(await readFile(snapshotTarget, 'utf8'))
    if (snapshot?.version !== 1 || !snapshot.sessions) {
      throw new Error('Unsupported generated Feishu snapshot format')
    }
    return snapshot
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
    return { version: 1, sessions: {} }
  }
}

async function fetchConfiguredCalendar() {
  if (!config.calendarId) {
    console.warn(
      'Calendar sync skipped: set calendarId in content/feishu/sessions.json ' +
        'or FEISHU_CALENDAR_ID.'
    )
    return []
  }

  const range = dateRangeToUnixSeconds(config.calendarRange, config.timezone)
  return listCalendarEvents(client, {
    calendarId: config.calendarId,
    ...range
  })
}

function applyCalendarData(snapshot, events) {
  if (!config.calendarId) return
  const eventById = new Map(events.map((event) => [event.event_id, event]))

  for (const session of config.sessions) {
    if (!session.calendarEventId) continue
    const event = eventById.get(session.calendarEventId)
    if (!event) {
      throw new Error(
        `Calendar event ${session.calendarEventId} for Session ${session.id} ` +
          'was not found in the configured range'
      )
    }

    const current = snapshot.sessions[session.id] ?? {}
    snapshot.sessions[session.id] = {
      ...current,
      calendar: eventToPublicData(
        event,
        config.timezone,
        config.publishMeetingUrl
      )
    }
  }
}

async function stageWikiSession({ session, snapshot, wikiRoutes }) {
  console.log(`Fetching Session ${session.id} Wiki…`)
  const document = await fetchWikiMarkdown(client, session.wikiNodeToken)

  if (referenceCount(document.referenceMap) > 0) {
    throw new Error(
      `Session ${session.id} contains unresolved Feishu references; ` +
        'support must be added before publishing it safely'
    )
  }

  const assetDirectory = path.join(stagedAssets, session.id)
  await mkdir(assetDirectory, { recursive: true })
  const mediaCache = new Map()
  let lastMediaRequest = 0

  const body = await normalizeFeishuMarkdown(document.markdown, {
    sessionId: session.id,
    wikiRoutes,
    async downloadAsset({ token, name, kind }) {
      if (mediaCache.has(token)) return mediaCache.get(token)

      const elapsed = Date.now() - lastMediaRequest
      if (elapsed < 220) await delay(220 - elapsed)
      const media = await downloadDocumentMedia(client, token)
      lastMediaRequest = Date.now()

      if (media.contentType.split(';', 1)[0].trim() === 'image/svg+xml') {
        throw new Error(
          `Session ${session.id} contains an SVG asset; convert it to PNG ` +
            'before publishing to avoid active content'
        )
      }
      const extension = safeExtension(name, media.contentType, kind)
      const digest = createHash('sha256').update(media.buffer).digest('hex')
      const fileName = `${digest.slice(0, 24)}${extension}`
      const filePath = path.join(assetDirectory, fileName)
      await writeFile(filePath, media.buffer)

      const result = {
        publicPath: `/feishu/${session.id}/${fileName}`
      }
      mediaCache.set(token, result)
      return result
    }
  })

  const calendarTitle = snapshot.sessions[session.id]?.calendar?.summary
  const page = renderSessionPage({
    session: {
      ...session,
      pageTitle: calendarTitle || session.pageTitle || document.node.title
    },
    body
  })
  const pagePath = path.join(stagedPages, `${session.id}.md`)
  await mkdir(path.dirname(pagePath), { recursive: true })
  await writeFile(pagePath, page, 'utf8')

  const current = snapshot.sessions[session.id] ?? {}
  snapshot.sessions[session.id] = {
    ...current,
    document: {
      wikiNodeToken: session.wikiNodeToken,
      documentId: document.node.obj_token,
      objectType: document.node.obj_type,
      sourceTitle: document.node.title || '',
      revisionId: document.revisionId
    }
  }

  operations.push({
    staged: pagePath,
    target: path.join(repoRoot, `docs/sessions/${session.id}.md`),
    label: `Session ${session.id} page`
  })
  operations.push({
    staged: assetDirectory,
    target: path.join(repoRoot, `docs/public/feishu/${session.id}`),
    label: `Session ${session.id} assets`
  })
}

function referenceCount(referenceMap) {
  if (!referenceMap || typeof referenceMap !== 'object') return 0
  return Object.values(referenceMap).reduce((total, group) => {
    if (!group || typeof group !== 'object') return total
    return total + Object.keys(group).length
  }, 0)
}

function safeExtension(name, contentType, kind) {
  const named = name ? path.extname(name).toLowerCase() : ''
  if (/^\.[a-z0-9]{1,8}$/.test(named)) return named

  const mime = contentType.split(';', 1)[0].trim().toLowerCase()
  const known = {
    'image/avif': '.avif',
    'image/gif': '.gif',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/svg+xml': '.svg',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
    'text/plain': '.txt',
    'application/zip': '.zip'
  }[mime]
  if (known) return known
  return kind === 'img' ? '.img' : '.bin'
}

async function pathsEqual(left, right) {
  try {
    await access(right)
  } catch {
    return false
  }
  return (await digestPath(left)) === (await digestPath(right))
}

async function digestPath(inputPath, relative = '') {
  const info = await stat(inputPath)
  const hash = createHash('sha256')

  if (info.isFile()) {
    hash.update(`file:${relative}\0`)
    hash.update(await readFile(inputPath))
    return hash.digest('hex')
  }
  if (!info.isDirectory()) {
    throw new Error(`Generated path is neither a file nor a directory: ${inputPath}`)
  }

  hash.update(`directory:${relative}\0`)
  const entries = await readdir(inputPath, { withFileTypes: true })
  entries.sort((a, b) => a.name.localeCompare(b.name))
  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      throw new Error(`Generated output may not contain symlinks: ${entry.name}`)
    }
    hash.update(
      await digestPath(path.join(inputPath, entry.name), path.join(relative, entry.name))
    )
  }
  return hash.digest('hex')
}

async function commitOperations(changedOperations) {
  if (changedOperations.length === 0) return
  const backupRoot = path.join(stagingRoot, 'backups')
  await mkdir(backupRoot, { recursive: true })
  const committed = []

  try {
    for (const [index, operation] of changedOperations.entries()) {
      const backup = path.join(backupRoot, String(index))
      const existed = await pathExists(operation.target)
      await mkdir(path.dirname(operation.target), { recursive: true })
      let movedExistingTarget = false
      try {
        if (existed) {
          await rename(operation.target, backup)
          movedExistingTarget = true
        }
        await rename(operation.staged, operation.target)
        committed.push({ ...operation, backup, existed })
      } catch (error) {
        if (movedExistingTarget) {
          await rm(operation.target, { recursive: true, force: true })
          await rename(backup, operation.target)
        }
        throw error
      }
    }
  } catch (error) {
    for (const item of committed.reverse()) {
      await rm(item.target, { recursive: true, force: true })
      if (item.existed) await rename(item.backup, item.target)
    }
    throw error
  }
}

async function pathExists(inputPath) {
  try {
    await access(inputPath)
    return true
  } catch {
    return false
  }
}

function stableJson(value) {
  const orderedSessions = Object.fromEntries(
    Object.entries(value.sessions).sort(([left], [right]) =>
      left.localeCompare(right)
    )
  )
  return `${JSON.stringify({ version: value.version, sessions: orderedSessions }, null, 2)}\n`
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
