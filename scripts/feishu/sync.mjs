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
  downloadFeishuMediaUrl,
  fetchWikiMarkdown,
  listCalendarEvents,
  listWikiNodes,
  resolveWikiNode
} from './client.mjs'
import { readSyncConfig } from './config.mjs'
import { loadLocalEnv, requireFeishuCredentials } from './env.mjs'
import { normalizeFeishuMarkdown } from './markdown.mjs'
import { renderSessionPage, renderWikiPage } from './render.mjs'
import { stableSnapshotJson } from './snapshot.mjs'
import {
  calendarEventsToPublicData,
  dateRangeToUnixSeconds
} from './time.mjs'
import {
  breadcrumbsForWikiPage,
  discoverWikiCollection,
  renderWikiDirectoryMarkdown,
  wikiRouteForToken
} from './wiki.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '../..')
const dryRun = process.argv.includes('--dry-run')
const SESSION_ID_PATTERN = /^\d{2}$/
const snapshotTarget = path.join(
  repoRoot,
  'docs/.vitepress/data/generated/feishu.json'
)

await loadLocalEnv(repoRoot)
const credentials = requireFeishuCredentials()
const config = await readSyncConfig(repoRoot)
const client = createFeishuClient(credentials)
const stagingRoot = await mkdtemp(path.join(repoRoot, '.feishu-sync-'))
const stagedSessionPages = path.join(stagingRoot, 'sessions')
const stagedSessionAssets = path.join(stagingRoot, 'public/feishu/sessions')
const stagedWikiPages = path.join(stagingRoot, 'wiki')
const stagedWikiAssets = path.join(stagingRoot, 'public/feishu/wiki')
const stagedSnapshot = path.join(stagingRoot, 'feishu.json')
const operations = []

try {
  const snapshot = await readExistingSnapshot()
  reconcileConfiguredSessions(snapshot)
  const calendarEvents = await fetchConfiguredCalendar()
  applyCalendarData(snapshot, calendarEvents)
  const wikiCollection = await discoverConfiguredWiki()

  const wikiRoutes = new Map(
    config.sessions
      .filter(({ wikiNodeToken }) => wikiNodeToken)
      .map(({ id, wikiNodeToken }) => [
        wikiNodeToken,
        `/sessions/${id}`
      ])
  )
  if (wikiCollection) {
    for (const token of wikiCollection.rootAliases) {
      wikiRoutes.set(token, '/wiki/')
    }
    for (const { node } of wikiCollection.pages) {
      wikiRoutes.set(node.node_token, wikiRouteForToken(node.node_token))
    }
  }

  for (const session of config.sessions) {
    if (!session.wikiNodeToken) continue
    await stageWikiSession({ session, snapshot, wikiRoutes })
  }
  const wikiDocumentCount = wikiCollection
    ? await stageWikiCollection({ collection: wikiCollection, snapshot, wikiRoutes })
    : 0
  if (!wikiCollection) delete snapshot.wiki

  await mkdir(path.dirname(stagedSnapshot), { recursive: true })
  await writeFile(stagedSnapshot, stableSnapshotJson(snapshot), 'utf8')

  operations.push({
    staged: stagedSnapshot,
    target: snapshotTarget,
    label: 'generated Feishu data'
  })

  const changedOperations = []
  for (const operation of operations) {
    if (await operationChanged(operation)) {
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
            .length + wikiDocumentCount,
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
    if (
      snapshot?.version !== 1 ||
      !snapshot.sessions ||
      typeof snapshot.sessions !== 'object' ||
      Array.isArray(snapshot.sessions)
    ) {
      throw new Error('Unsupported generated Feishu snapshot format')
    }
    for (const [id, value] of Object.entries(snapshot.sessions)) {
      if (
        !SESSION_ID_PATTERN.test(id) ||
        !value ||
        typeof value !== 'object' ||
        Array.isArray(value)
      ) {
        throw new Error('Generated Feishu snapshot contains an invalid session')
      }
    }
    return snapshot
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
    return { version: 1, sessions: {} }
  }
}

function reconcileConfiguredSessions(snapshot) {
  const configuredById = new Map(
    config.sessions.map((session) => [session.id, session])
  )

  for (const [id, current] of Object.entries(snapshot.sessions)) {
    const configured = configuredById.get(id)
    if (!configured) {
      delete snapshot.sessions[id]
      queueSessionOutputRemoval(id)
      continue
    }

    const next = { ...current }
    if (!configured.wikiNodeToken && next.document) {
      delete next.document
      queueSessionOutputRemoval(id)
    }
    if (!configured.calendarEventId && next.calendar) {
      delete next.calendar
    }

    if (Object.keys(next).length > 0) {
      snapshot.sessions[id] = next
    } else {
      delete snapshot.sessions[id]
    }
  }
}

function queueSessionOutputRemoval(id) {
  operations.push({
    remove: true,
    target: path.join(repoRoot, `docs/sessions/${id}.md`),
    label: `removed Session ${id} page`
  })
  operations.push({
    remove: true,
    target: path.join(repoRoot, `docs/public/feishu/${id}`),
    label: `removed Session ${id} assets`
  })
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

async function discoverConfiguredWiki() {
  if (!config.wiki) return null

  console.log(`Discovering Wiki collection ${config.wiki.rootNodeToken}…`)
  return discoverWikiCollection({
    rootNodeToken: config.wiki.rootNodeToken,
    fetchDocument: (token) => fetchWikiMarkdown(client, token),
    resolveNode: (token) => resolveWikiNode(client, token),
    listNodes: ({ spaceId, parentNodeToken }) =>
      listWikiNodes(client, { spaceId, parentNodeToken })
  })
}

function applyCalendarData(snapshot, events) {
  if (!config.calendarId) {
    delete snapshot.calendar
    return
  }

  const publicEvents = calendarEventsToPublicData(
    events,
    config.timezone,
    config.publishMeetingUrl
  )
  snapshot.calendar = {
    timezone: config.timezone,
    range: config.calendarRange,
    events: publicEvents
  }
  const eventById = new Map(
    publicEvents.map((event) => [event.eventId, event])
  )

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
      calendar: event
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

  const assetDirectory = path.join(stagedSessionAssets, session.id)
  await mkdir(assetDirectory, { recursive: true })

  const body = await normalizeFeishuMarkdown(document.markdown, {
    sessionId: session.id,
    wikiRoutes,
    downloadAsset: createMediaDownloader({
      assetDirectory,
      publicBasePath: `/feishu/${session.id}`,
      contextLabel: `Session ${session.id}`
    })
  })

  const calendarTitle = snapshot.sessions[session.id]?.calendar?.summary
  const page = renderSessionPage({
    session: {
      ...session,
      pageTitle: calendarTitle || session.pageTitle || document.node.title
    },
    body
  })
  const pagePath = path.join(stagedSessionPages, `${session.id}.md`)
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

async function stageWikiCollection({ collection, snapshot, wikiRoutes }) {
  const collectionTitle =
    config.wiki.title || collection.rootDocument.node.title || 'Wiki 讲义'
  const pages = []
  await mkdir(stagedWikiPages, { recursive: true })
  await mkdir(stagedWikiAssets, { recursive: true })

  function renderSubPageList(attributes) {
    const referenceToken = attributes['wiki-token']
    const directoryToken =
      collection.directoryAliases.get(referenceToken) || referenceToken
    if (!directoryToken || !collection.directoryChildren.has(directoryToken)) {
      throw new Error(
        `Wiki directory block references undiscovered node ` +
          `${referenceToken || '(missing)'}`
      )
    }

    return (
      renderWikiDirectoryMarkdown({
        directoryToken,
        directoryChildren: collection.directoryChildren,
        pageByToken: collection.pageByToken
      }) || '_暂无子页面_'
    )
  }

  const rootDetails = await stageWikiCollectionPage({
    document: collection.rootDocument,
    wikiNodeToken: config.wiki.rootNodeToken,
    outputPath: path.join(stagedWikiPages, 'index.md'),
    breadcrumbs: [],
    collectionTitle,
    wikiRoutes,
    renderSubPageList
  })

  for (const page of collection.pages) {
    await delay(220)
    const document = await fetchWikiMarkdown(client, page.node.node_token)
    const details = await stageWikiCollectionPage({
      document,
      wikiNodeToken: page.node.node_token,
      outputPath: path.join(stagedWikiPages, `${page.node.node_token}.md`),
      breadcrumbs: breadcrumbsForWikiPage(page, collection.pageByToken),
      collectionTitle,
      wikiRoutes,
      renderSubPageList
    })
    pages.push({
      wikiNodeToken: page.node.node_token,
      parentWikiNodeToken: page.parentWikiNodeToken,
      title: details.sourceTitle,
      route: wikiRouteForToken(page.node.node_token),
      depth: page.depth,
      order: page.order,
      documentId: details.documentId,
      objectType: details.objectType,
      revisionId: details.revisionId
    })
  }

  snapshot.wiki = {
    title: collectionTitle,
    rootNodeToken: config.wiki.rootNodeToken,
    sourceUrl: `${config.wiki.sourceBaseUrl}/${config.wiki.rootNodeToken}`,
    documentId: rootDetails.documentId,
    objectType: rootDetails.objectType,
    revisionId: rootDetails.revisionId,
    pages
  }

  operations.push({
    staged: stagedWikiPages,
    target: path.join(repoRoot, 'docs/wiki'),
    label: 'Wiki collection pages'
  })
  operations.push({
    staged: stagedWikiAssets,
    target: path.join(repoRoot, 'docs/public/feishu/wiki'),
    label: 'Wiki collection assets'
  })

  return pages.length + 1
}

async function stageWikiCollectionPage({
  document,
  wikiNodeToken,
  outputPath,
  breadcrumbs,
  collectionTitle,
  wikiRoutes,
  renderSubPageList
}) {
  const sourceTitle = document.node.title || '未命名页面'
  const contextLabel = `Wiki page ${sourceTitle}`
  if (referenceCount(document.referenceMap) > 0) {
    throw new Error(
      `${contextLabel} contains unresolved Feishu references; ` +
        'support must be added before publishing it safely'
    )
  }

  const assetDirectory = path.join(stagedWikiAssets, wikiNodeToken)
  await mkdir(assetDirectory, { recursive: true })
  const body = await normalizeFeishuMarkdown(document.markdown, {
    contextLabel,
    wikiRoutes,
    renderSubPageList,
    downloadAsset: createMediaDownloader({
      assetDirectory,
      publicBasePath: `/feishu/wiki/${wikiNodeToken}`,
      contextLabel
    })
  })
  const page = renderWikiPage({
    title: sourceTitle,
    body,
    breadcrumbs,
    collectionTitle
  })
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, page, 'utf8')

  return {
    sourceTitle,
    documentId: document.node.obj_token,
    objectType: document.node.obj_type,
    revisionId: document.revisionId
  }
}

function createMediaDownloader({
  assetDirectory,
  publicBasePath,
  contextLabel
}) {
  const mediaCache = new Map()
  let lastMediaRequest = 0

  return async function downloadAsset({ token, sourceUrl, name, kind }) {
    const mediaKey = token ? `token:${token}` : sourceUrl ? `url:${sourceUrl}` : ''
    if (!mediaKey) {
      throw new Error(`${contextLabel} contains media without a download source`)
    }
    if (mediaCache.has(mediaKey)) return mediaCache.get(mediaKey)

    const elapsed = Date.now() - lastMediaRequest
    if (elapsed < 220) await delay(220 - elapsed)
    const media = sourceUrl
      ? await downloadFeishuMediaUrl(sourceUrl)
      : await downloadDocumentMedia(client, token)
    lastMediaRequest = Date.now()

    const mediaType = media.contentType.split(';', 1)[0].trim().toLowerCase()
    if (kind === 'img' && !mediaType.startsWith('image/')) {
      throw new Error(
        `${contextLabel} image download returned ${mediaType || 'an unknown content type'}`
      )
    }
    if (mediaType === 'image/svg+xml') {
      throw new Error(
        `${contextLabel} contains an SVG asset; convert it to PNG ` +
          'before publishing to avoid active content'
      )
    }
    const extension = safeExtension(name, media.contentType, kind)
    const digest = createHash('sha256').update(media.buffer).digest('hex')
    const fileName = `${digest.slice(0, 24)}${extension}`
    const filePath = path.join(assetDirectory, fileName)
    await writeFile(filePath, media.buffer)

    const result = {
      publicPath: `${publicBasePath}/${fileName}`
    }
    mediaCache.set(mediaKey, result)
    return result
  }
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

async function operationChanged(operation) {
  if (operation.remove) return pathExists(operation.target)
  return !(await pathsEqual(operation.staged, operation.target))
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
        if (!operation.remove) {
          await rename(operation.staged, operation.target)
        }
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

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
