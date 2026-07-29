import { readFile } from 'node:fs/promises'
import path from 'node:path'

const SESSION_ID_PATTERN = /^\d{2}$/
const TOKEN_PATTERN = /^[A-Za-z0-9_-]+$/

export async function readSyncConfig(repoRoot) {
  const configPath = path.join(repoRoot, 'content/feishu/sessions.json')
  const config = JSON.parse(await readFile(configPath, 'utf8'))

  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error(`${configPath} must contain a JSON object`)
  }
  if (!Array.isArray(config.sessions)) {
    throw new Error('Feishu sync config requires a sessions array')
  }

  const ids = new Set()
  for (const session of config.sessions) {
    if (!session || typeof session !== 'object' || Array.isArray(session)) {
      throw new Error('Each Feishu session mapping must be an object')
    }
    if (!SESSION_ID_PATTERN.test(session.id ?? '')) {
      throw new Error(`Invalid session id: ${String(session.id)}`)
    }
    if (ids.has(session.id)) {
      throw new Error(`Duplicate session id in Feishu config: ${session.id}`)
    }
    ids.add(session.id)

    const wikiNodeToken = session.wikiNodeToken
    if (
      wikiNodeToken !== undefined &&
      wikiNodeToken !== '' &&
      !TOKEN_PATTERN.test(wikiNodeToken)
    ) {
      throw new Error(`Invalid wikiNodeToken for Session ${session.id}`)
    }
  }

  return {
    wiki: readWikiConfig(config.wiki),
    sessions: config.sessions
  }
}

function readWikiConfig(value) {
  if (value === undefined) return null
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Feishu sync config wiki must be an object')
  }
  if (!TOKEN_PATTERN.test(value.rootNodeToken ?? '')) {
    throw new Error('Feishu sync config wiki requires a valid rootNodeToken')
  }
  if (
    value.title !== undefined &&
    (typeof value.title !== 'string' ||
      value.title.length === 0 ||
      value.title.length > 100 ||
      /[\u0000-\u001f\u007f]/.test(value.title))
  ) {
    throw new Error('Feishu sync config wiki.title must be 1-100 safe characters')
  }

  let sourceBaseUrl
  try {
    sourceBaseUrl = new URL(value.sourceBaseUrl)
  } catch {
    throw new Error('Feishu sync config wiki.sourceBaseUrl must be a valid URL')
  }
  if (
    sourceBaseUrl.protocol !== 'https:' ||
    sourceBaseUrl.search ||
    sourceBaseUrl.hash ||
    sourceBaseUrl.pathname.replace(/\/+$/, '') !== '/wiki'
  ) {
    throw new Error(
      'Feishu sync config wiki.sourceBaseUrl must be an HTTPS /wiki URL'
    )
  }

  return {
    rootNodeToken: value.rootNodeToken,
    title: value.title,
    sourceBaseUrl: sourceBaseUrl.href.replace(/\/+$/, '')
  }
}
