import { readFile } from 'node:fs/promises'
import path from 'node:path'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const SESSION_ID_PATTERN = /^\d{2}$/
const TOKEN_PATTERN = /^[A-Za-z0-9_-]+$/

export async function readSyncConfig(repoRoot) {
  const configPath = path.join(repoRoot, 'content/feishu/sessions.json')
  const config = JSON.parse(await readFile(configPath, 'utf8'))

  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error(`${configPath} must contain a JSON object`)
  }
  if (typeof config.timezone !== 'string' || !config.timezone) {
    throw new Error('Feishu sync config requires a timezone')
  }

  try {
    new Intl.DateTimeFormat('en', { timeZone: config.timezone }).format()
  } catch {
    throw new Error(`Invalid IANA timezone in Feishu sync config: ${config.timezone}`)
  }

  if (!Array.isArray(config.sessions) || config.sessions.length === 0) {
    throw new Error('Feishu sync config requires at least one session')
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
    const eventId = session.calendarEventId
    if (
      eventId !== undefined &&
      eventId !== '' &&
      (typeof eventId !== 'string' ||
        eventId.length > 512 ||
        /[\u0000-\u001f\u007f]/.test(eventId))
    ) {
      throw new Error(`Invalid calendarEventId for Session ${session.id}`)
    }
  }

  if (config.calendarRange) {
    const { start, end } = config.calendarRange
    if (!DATE_PATTERN.test(start ?? '') || !DATE_PATTERN.test(end ?? '')) {
      throw new Error('calendarRange.start/end must use YYYY-MM-DD')
    }
    if (start >= end) {
      throw new Error('calendarRange.end must be after calendarRange.start')
    }
  }

  return {
    timezone: config.timezone,
    calendarId:
      process.env.FEISHU_CALENDAR_ID?.trim() || config.calendarId?.trim() || '',
    calendarRange: config.calendarRange,
    publishMeetingUrl: config.publishMeetingUrl === true,
    sessions: config.sessions
  }
}
