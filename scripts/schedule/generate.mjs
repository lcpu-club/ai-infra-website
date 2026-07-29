import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { Temporal } from 'temporal-polyfill'
import { parseDocument } from 'yaml'

const scriptPath = fileURLToPath(import.meta.url)
const scriptDir = path.dirname(scriptPath)
const defaultRepoRoot = path.resolve(scriptDir, '../..')

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})$/
const EVENT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ASSIGNMENT_ID_PATTERN = /^[A-Z][A-Z0-9-]{1,31}$/
const SESSION_ID_PATTERN = /^\d{2}$/
const TOPICS = new Set(['kernel', 'comm', 'serving', 'rl'])
const ACCENTS = new Set([...TOPICS, 'neutral'])
const EVENT_TYPES = new Set([
  'lecture',
  'guest-lecture',
  'workshop',
  'office-hours',
  'other'
])
const CONFIRMATIONS = new Set(['tentative', 'confirmed', 'cancelled'])
const ASSIGNMENT_LINK_TYPES = new Set([
  'spec',
  'starter',
  'submission',
  'solution',
  'other'
])

export async function generateScheduleContent({
  repoRoot = defaultRepoRoot
} = {}) {
  const scheduleSource = await readYaml(
    path.join(repoRoot, 'content/schedule.yaml')
  )
  const assignmentSource = await readYaml(
    path.join(repoRoot, 'content/assignments.yaml')
  )
  const generated = buildScheduleData(scheduleSource, assignmentSource)
  const jsonTarget = path.join(
    repoRoot,
    'docs/.vitepress/data/generated/schedule.json'
  )
  const calendarTarget = path.join(repoRoot, 'docs/public/calendar.ics')
  const assignmentsTarget = path.join(
    repoRoot,
    'docs/public/assignments.ics'
  )

  await Promise.all([
    writeIfChanged(jsonTarget, `${JSON.stringify(generated, null, 2)}\n`),
    writeIfChanged(calendarTarget, renderCalendarIcs(generated)),
    writeIfChanged(
      assignmentsTarget,
      renderAssignmentCalendarIcs(generated)
    )
  ])

  return {
    eventCount: generated.events.length,
    assignmentCount: generated.assignments.length,
    targets: [jsonTarget, calendarTarget, assignmentsTarget]
  }
}

export function buildScheduleData(scheduleSource, assignmentSource) {
  const schedule = requireRecord(scheduleSource, 'schedule')
  exactKeys(
    schedule,
    ['$schema', 'version', 'timezone', 'siteUrl', 'events'],
    'schedule'
  )
  assertVersion(schedule.version, 'schedule.version')
  const timezone = requireString(schedule.timezone, 'schedule.timezone', 100)
  assertTimezone(timezone)
  const siteUrl = requireSiteUrl(schedule.siteUrl, 'schedule.siteUrl')
  const rawEvents = requireArray(schedule.events, 'schedule.events')

  const assignmentsDocument = requireRecord(
    assignmentSource,
    'assignments document'
  )
  exactKeys(
    assignmentsDocument,
    ['$schema', 'version', 'assignments'],
    'assignments document'
  )
  assertVersion(assignmentsDocument.version, 'assignments.version')
  const rawAssignments = requireArray(
    assignmentsDocument.assignments,
    'assignments.assignments'
  )

  const assignmentIds = new Set()
  const assignments = rawAssignments.map((value, index) => {
    const assignment = normalizeAssignment(
      value,
      `assignments.assignments[${index}]`,
      timezone
    )
    if (assignmentIds.has(assignment.id)) {
      throw new Error(`Duplicate assignment id: ${assignment.id}`)
    }
    assignmentIds.add(assignment.id)
    return assignment
  })

  const eventIds = new Set()
  const events = rawEvents.map((value, index) => {
    const event = normalizeEvent(
      value,
      `schedule.events[${index}]`,
      timezone
    )
    if (eventIds.has(event.eventId)) {
      throw new Error(`Duplicate event id: ${event.eventId}`)
    }
    eventIds.add(event.eventId)
    for (const assignmentId of event.assignmentIds) {
      if (!assignmentIds.has(assignmentId)) {
        throw new Error(
          `Event ${event.eventId} references unknown assignment ${assignmentId}`
        )
      }
    }
    return event
  })

  const publishedEvents = events
    .filter((event) => event.published)
    .sort(compareEvents)
    .map(({ published, ...event }) => event)
  const eventIdsByAssignment = new Map()
  for (const event of publishedEvents) {
    for (const assignmentId of event.assignmentIds) {
      const ids = eventIdsByAssignment.get(assignmentId) ?? []
      ids.push(event.eventId)
      eventIdsByAssignment.set(assignmentId, ids)
    }
  }

  const publishedAssignments = assignments
    .filter((assignment) => assignment.published)
    .map(({ published, ...assignment }) => ({
      ...assignment,
      eventIds: eventIdsByAssignment.get(assignment.id) ?? []
    }))
    .sort(compareAssignments)

  return {
    version: 1,
    timezone,
    siteUrl,
    events: publishedEvents,
    assignments: publishedAssignments
  }
}

export function renderCalendarIcs(data) {
  return renderIcs({
    name: 'AI Infra Seminars',
    timezone: data.timezone,
    entries: [
      ...data.events.map((event) => eventToIcsLines(event, data.siteUrl)),
      ...data.assignments
        .filter(({ due }) => due)
        .map(assignmentToIcsLines)
    ]
  })
}

export function renderAssignmentCalendarIcs(data) {
  return renderIcs({
    name: 'AI Infra Seminars · Assignment Deadlines',
    timezone: data.timezone,
    entries: data.assignments
      .filter(({ due }) => due)
      .map(assignmentToIcsLines)
  })
}

function normalizeEvent(value, context, timezone) {
  const event = requireRecord(value, context)
  exactKeys(
    event,
    [
      'id',
      'type',
      'topic',
      'sessions',
      'title',
      'description',
      'start',
      'end',
      'confirmation',
      'speakers',
      'locations',
      'links',
      'assignments',
      'published',
      'display'
    ],
    context
  )

  const eventId = requirePattern(
    event.id,
    `${context}.id`,
    EVENT_ID_PATTERN
  )
  const type = requireEnum(event.type, `${context}.type`, EVENT_TYPES)
  const topic =
    event.topic === undefined
      ? undefined
      : requireEnum(event.topic, `${context}.topic`, TOPICS)
  const sessionIds = optionalArray(event.sessions, `${context}.sessions`).map(
    (id, index) =>
      requirePattern(
        id,
        `${context}.sessions[${index}]`,
        SESSION_ID_PATTERN
      )
  )
  assertUnique(sessionIds, `${context}.sessions`)

  const title = normalizeLocalizedText(event.title, `${context}.title`, 300)
  const description =
    event.description === undefined
      ? undefined
      : normalizeLocalizedText(
          event.description,
          `${context}.description`,
          20_000
        )
  const start = requireDateOrDateTime(event.start, `${context}.start`)
  const end = requireDateOrDateTime(event.end, `${context}.end`)
  const timing = normalizeEventTiming(start, end, timezone, context)
  const status = requireEnum(
    event.confirmation,
    `${context}.confirmation`,
    CONFIRMATIONS
  )
  const speakers = optionalArray(event.speakers, `${context}.speakers`).map(
    (speaker, index) =>
      normalizeSpeaker(speaker, `${context}.speakers[${index}]`)
  )
  const locations = optionalArray(
    event.locations,
    `${context}.locations`
  ).map((location, index) =>
    normalizeLocation(location, `${context}.locations[${index}]`)
  )
  const links = optionalArray(event.links, `${context}.links`).map(
    (link, index) =>
      normalizeEventLink(link, `${context}.links[${index}]`)
  )
  const assignmentIds = optionalArray(
    event.assignments,
    `${context}.assignments`
  ).map((id, index) =>
    requirePattern(
      id,
      `${context}.assignments[${index}]`,
      ASSIGNMENT_ID_PATTERN
    )
  )
  assertUnique(assignmentIds, `${context}.assignments`)
  const display = normalizeDisplay(event.display, `${context}.display`, topic)

  return {
    eventId,
    type,
    ...(topic ? { topic } : {}),
    ...(sessionIds.length ? { sessionIds } : {}),
    title,
    ...(description ? { description } : {}),
    ...timing,
    timezone,
    status,
    ...(speakers.length ? { speakers } : {}),
    locations,
    links,
    assignmentIds,
    display,
    published: event.published !== false
  }
}

function normalizeAssignment(value, context, timezone) {
  const assignment = requireRecord(value, context)
  exactKeys(
    assignment,
    [
      'id',
      'title',
      'description',
      'release',
      'due',
      'links',
      'published'
    ],
    context
  )

  const id = requirePattern(
    assignment.id,
    `${context}.id`,
    ASSIGNMENT_ID_PATTERN
  )
  const title = normalizeLocalizedText(
    assignment.title,
    `${context}.title`,
    300
  )
  const description =
    assignment.description === undefined
      ? undefined
      : normalizeLocalizedText(
          assignment.description,
          `${context}.description`,
          20_000
        )
  const release =
    assignment.release === undefined
      ? undefined
      : normalizeMoment(
          requireDateOrDateTime(assignment.release, `${context}.release`),
          timezone,
          'release'
        )
  const due =
    assignment.due === undefined
      ? undefined
      : normalizeMoment(
          requireDateOrDateTime(assignment.due, `${context}.due`),
          timezone,
          'due'
        )
  if (
    release &&
    due &&
    Temporal.Instant.compare(
      Temporal.Instant.from(release.boundaryAt),
      Temporal.Instant.from(due.boundaryAt)
    ) >= 0
  ) {
    throw new Error(`${context}.due must be after ${context}.release`)
  }
  const links = optionalArray(assignment.links, `${context}.links`).map(
    (link, index) =>
      normalizeLink(
        link,
        `${context}.links[${index}]`,
        ASSIGNMENT_LINK_TYPES
      )
  )

  return {
    id,
    title,
    ...(description ? { description } : {}),
    ...(release ? { release } : {}),
    ...(due ? { due } : {}),
    ...(links.length ? { links } : { links: [] }),
    published: assignment.published !== false
  }
}

function normalizeEventTiming(start, end, timezone, context) {
  const startIsDate = DATE_PATTERN.test(start)
  const endIsDate = DATE_PATTERN.test(end)
  if (startIsDate !== endIsDate) {
    throw new Error(`${context}.start and ${context}.end must use the same form`)
  }

  if (startIsDate) {
    const startDate = Temporal.PlainDate.from(start)
    const inclusiveEndDate = Temporal.PlainDate.from(end)
    if (Temporal.PlainDate.compare(inclusiveEndDate, startDate) < 0) {
      throw new Error(`${context}.end must not be before ${context}.start`)
    }
    const exclusiveEndDate = inclusiveEndDate.add({ days: 1 })
    return {
      date: startDate.toString(),
      endDate: exclusiveEndDate.toString(),
      startAt: startDate
        .toZonedDateTime(timezone)
        .toInstant()
        .toString(),
      endAt: exclusiveEndDate
        .toZonedDateTime(timezone)
        .toInstant()
        .toString(),
      allDay: true
    }
  }

  const startInstant = Temporal.Instant.from(start)
  const endInstant = Temporal.Instant.from(end)
  if (Temporal.Instant.compare(endInstant, startInstant) <= 0) {
    throw new Error(`${context}.end must be after ${context}.start`)
  }
  const localStart = startInstant.toZonedDateTimeISO(timezone)
  const localEnd = endInstant.toZonedDateTimeISO(timezone)
  return {
    date: localStart.toPlainDate().toString(),
    endDate: localEnd.toPlainDate().toString(),
    startAt: startInstant.toString(),
    endAt: endInstant.toString(),
    allDay: false,
    timeLabel: formatTimeRange(localStart, localEnd)
  }
}

function normalizeMoment(value, timezone, kind) {
  if (DATE_PATTERN.test(value)) {
    const date = Temporal.PlainDate.from(value)
    const boundaryDate = kind === 'due' ? date.add({ days: 1 }) : date
    return {
      allDay: true,
      date: date.toString(),
      boundaryAt: boundaryDate
        .toZonedDateTime(timezone)
        .toInstant()
        .toString()
    }
  }

  const instant = Temporal.Instant.from(value)
  return {
    allDay: false,
    date: instant.toZonedDateTimeISO(timezone).toPlainDate().toString(),
    at: instant.toString(),
    boundaryAt: instant.toString()
  }
}

function normalizeSpeaker(value, context) {
  const speaker = requireRecord(value, context)
  exactKeys(speaker, ['name', 'role', 'href'], context)
  return {
    name: normalizeLocalizedText(speaker.name, `${context}.name`, 200),
    ...(speaker.role === undefined
      ? {}
      : {
          role: normalizeLocalizedText(
            speaker.role,
            `${context}.role`,
            200
          )
        }),
    ...(speaker.href === undefined
      ? {}
      : { href: requireHref(speaker.href, `${context}.href`) })
  }
}

function normalizeLocation(value, context) {
  const location = requireRecord(value, context)
  exactKeys(location, ['label', 'href'], context)
  return {
    label: normalizeLocalizedText(location.label, `${context}.label`, 200),
    ...(location.href === undefined
      ? {}
      : { href: requireHref(location.href, `${context}.href`) })
  }
}

function normalizeEventLink(value, context) {
  const link = requireRecord(value, context)
  exactKeys(link, ['label', 'href'], context)
  return {
    label: normalizeLocalizedText(link.label, `${context}.label`, 200),
    href: requireHref(link.href, `${context}.href`)
  }
}

function normalizeLink(value, context, allowedTypes) {
  const link = requireRecord(value, context)
  exactKeys(link, ['type', 'label', 'href'], context)
  return {
    type: requireEnum(link.type, `${context}.type`, allowedTypes),
    label: normalizeLocalizedText(link.label, `${context}.label`, 200),
    href: requireHref(link.href, `${context}.href`)
  }
}

function normalizeDisplay(value, context, topic) {
  if (value === undefined) {
    return {
      homepage: true,
      calendar: true,
      accent: topic ?? 'neutral'
    }
  }
  const display = requireRecord(value, context)
  exactKeys(display, ['homepage', 'calendar', 'accent'], context)
  return {
    homepage:
      display.homepage === undefined
        ? true
        : requireBoolean(display.homepage, `${context}.homepage`),
    calendar:
      display.calendar === undefined
        ? true
        : requireBoolean(display.calendar, `${context}.calendar`),
    accent:
      display.accent === undefined
        ? topic ?? 'neutral'
        : requireEnum(display.accent, `${context}.accent`, ACCENTS)
  }
}

function normalizeLocalizedText(value, context, maximumLength) {
  const text = requireRecord(value, context)
  exactKeys(text, ['zh', 'en'], context)
  return {
    zh: requireString(text.zh, `${context}.zh`, maximumLength, {
      allowNewlines: true
    }),
    ...(text.en === undefined
      ? {}
      : {
          en: requireString(text.en, `${context}.en`, maximumLength, {
            allowNewlines: true
          })
        })
  }
}

function compareEvents(left, right) {
  return (
    left.startAt.localeCompare(right.startAt) ||
    left.eventId.localeCompare(right.eventId)
  )
}

function compareAssignments(left, right) {
  return (
    (left.due?.boundaryAt ?? '9999').localeCompare(
      right.due?.boundaryAt ?? '9999'
    ) || left.id.localeCompare(right.id)
  )
}

function formatTimeRange(start, end) {
  const startTime = `${pad(start.hour)}:${pad(start.minute)}`
  const endTime = `${pad(end.hour)}:${pad(end.minute)}`
  if (start.toPlainDate().equals(end.toPlainDate())) {
    return `${startTime}–${endTime}`
  }
  return `${startTime}–${end.month}-${pad(end.day)} ${endTime}`
}

function eventToIcsLines(event, siteUrl) {
  const lines = [
    'BEGIN:VEVENT',
    `UID:event-${event.eventId}@ai-infra-seminars.lcpu.dev`,
    `DTSTAMP:${formatUtc(event.startAt)}`,
    `SUMMARY:${escapeIcsText(event.title.zh)}`,
    `STATUS:${event.status.toUpperCase()}`,
    `CATEGORIES:${['AI INFRA', event.type, event.topic]
      .filter(Boolean)
      .map(escapeIcsText)
      .join(',')}`
  ]
  if (event.allDay) {
    lines.push(
      `DTSTART;VALUE=DATE:${formatDate(event.date)}`,
      `DTEND;VALUE=DATE:${formatDate(event.endDate)}`
    )
  } else {
    lines.push(
      `DTSTART:${formatUtc(event.startAt)}`,
      `DTEND:${formatUtc(event.endAt)}`
    )
  }
  const linkedLocations = event.locations
    .filter(({ href }) => href)
    .map(
      (location) =>
        `${location.label.zh}: ${absoluteHref(location.href, siteUrl)}`
    )
    .join('\n')
  const links = event.links
    .map(
      (link) =>
        `${link.label.zh}: ${absoluteHref(link.href, siteUrl)}`
    )
    .join('\n')
  if (event.description?.zh || linkedLocations || links) {
    const description = [event.description?.zh, linkedLocations, links]
      .filter(Boolean)
      .join('\n\n')
    lines.push(`DESCRIPTION:${escapeIcsText(description)}`)
  }
  if (event.locations.length) {
    const location = event.locations
      .map(
        ({ label }) => label.zh
      )
      .join(' · ')
    lines.push(`LOCATION:${escapeIcsText(location)}`)
  }
  const primaryHref =
    event.links[0]?.href ??
    event.locations.find(({ href }) => href)?.href
  if (primaryHref) lines.push(`URL:${absoluteHref(primaryHref, siteUrl)}`)
  lines.push('TRANSP:OPAQUE', 'END:VEVENT')
  return lines
}

function assignmentToIcsLines(assignment) {
  const due = assignment.due
  const stamp = due.at ?? due.boundaryAt
  const lines = [
    'BEGIN:VEVENT',
    `UID:assignment-${assignment.id}@ai-infra-seminars.lcpu.dev`,
    `DTSTAMP:${formatUtc(stamp)}`,
    `SUMMARY:${escapeIcsText(`[DDL] ${assignment.id} · ${assignment.title.zh}`)}`,
    'STATUS:CONFIRMED',
    'CATEGORIES:AI INFRA,ASSIGNMENT,DEADLINE'
  ]
  if (due.allDay) {
    const date = Temporal.PlainDate.from(due.date)
    lines.push(
      `DTSTART;VALUE=DATE:${formatDate(date.toString())}`,
      `DTEND;VALUE=DATE:${formatDate(date.add({ days: 1 }).toString())}`
    )
  } else {
    lines.push(`DTSTART:${formatUtc(due.at)}`, 'DURATION:PT15M')
  }
  if (assignment.description?.zh) {
    lines.push(
      `DESCRIPTION:${escapeIcsText(assignment.description.zh)}`
    )
  }
  const primaryUrl = assignment.links[0]?.href
  if (primaryUrl) lines.push(`URL:${primaryUrl}`)
  lines.push('TRANSP:TRANSPARENT', 'END:VEVENT')
  return lines
}

function renderIcs({ name, timezone, entries }) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'PRODID:-//LCPU//AI Infra Seminars//ZH-CN',
    `X-WR-CALNAME:${escapeIcsText(name)}`,
    `X-WR-TIMEZONE:${escapeIcsText(timezone)}`,
    ...entries.flat(),
    'END:VCALENDAR'
  ]
  return `${lines.map(foldIcsLine).join('\r\n')}\r\n`
}

function escapeIcsText(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function foldIcsLine(line) {
  if (Buffer.byteLength(line, 'utf8') <= 75) return line
  const chunks = []
  let chunk = ''
  let bytes = 0
  for (const character of line) {
    const characterBytes = Buffer.byteLength(character, 'utf8')
    const limit = chunks.length === 0 ? 75 : 74
    if (bytes + characterBytes > limit && chunk) {
      chunks.push(chunk)
      chunk = ''
      bytes = 0
    }
    chunk += character
    bytes += characterBytes
  }
  if (chunk) chunks.push(chunk)
  return chunks.join('\r\n ')
}

function formatUtc(value) {
  return new Date(value)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
}

function formatDate(value) {
  return value.replace(/-/g, '')
}

async function readYaml(filePath) {
  const source = await readFile(filePath, 'utf8')
  const document = parseDocument(source, {
    uniqueKeys: true,
    maxAliasCount: 0
  })
  if (document.errors.length) {
    throw new Error(
      `${filePath}: ${document.errors.map(({ message }) => message).join('; ')}`
    )
  }
  return document.toJS({ maxAliasCount: 0 })
}

async function writeIfChanged(filePath, content) {
  try {
    if ((await readFile(filePath, 'utf8')) === content) return false
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, content, 'utf8')
  return true
}

function requireRecord(value, context) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${context} must be an object`)
  }
  return value
}

function requireArray(value, context) {
  if (!Array.isArray(value)) throw new Error(`${context} must be an array`)
  return value
}

function optionalArray(value, context) {
  return value === undefined ? [] : requireArray(value, context)
}

function requireString(
  value,
  context,
  maximumLength,
  { allowNewlines = false } = {}
) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${context} must be a non-empty string`)
  }
  const normalized = value.replace(/\r\n?/g, '\n').trim()
  if (normalized.length > maximumLength) {
    throw new Error(`${context} exceeds ${maximumLength} characters`)
  }
  const controlPattern = allowNewlines
    ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/
    : /[\u0000-\u001f\u007f]/
  if (controlPattern.test(normalized)) {
    throw new Error(`${context} contains unsafe control characters`)
  }
  return normalized
}

function requirePattern(value, context, pattern) {
  const string = requireString(value, context, 512)
  if (!pattern.test(string)) {
    throw new Error(`${context} has an invalid format`)
  }
  return string
}

function requireDateOrDateTime(value, context) {
  const string = requireString(value, context, 64)
  if (!DATE_PATTERN.test(string) && !DATE_TIME_PATTERN.test(string)) {
    throw new Error(
      `${context} must use YYYY-MM-DD or an ISO date-time with timezone`
    )
  }
  try {
    if (DATE_PATTERN.test(string)) Temporal.PlainDate.from(string)
    else Temporal.Instant.from(string)
  } catch {
    throw new Error(`${context} is not a valid date or date-time`)
  }
  return string
}

function requireHref(value, context) {
  const href = requireString(value, context, 2_048)
  if (href.startsWith('/')) {
    if (href.startsWith('//') || href.includes('\\')) {
      throw new Error(`${context} contains an invalid site-relative URL`)
    }
    return href
  }
  let url
  try {
    url = new URL(href)
  } catch {
    throw new Error(`${context} must be a site-relative or HTTPS URL`)
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password
  ) {
    throw new Error(`${context} must be a safe HTTPS URL`)
  }
  return url.href
}

function requireSiteUrl(value, context) {
  const href = requireHref(value, context)
  if (!href.startsWith('https://')) {
    throw new Error(`${context} must be an absolute HTTPS URL`)
  }
  const url = new URL(href)
  if (url.search || url.hash) {
    throw new Error(`${context} must not contain a query or fragment`)
  }
  return url.href.replace(/\/+$/, '')
}

function absoluteHref(href, siteUrl) {
  return href.startsWith('/') ? new URL(href, `${siteUrl}/`).href : href
}

function requireEnum(value, context, choices) {
  if (typeof value !== 'string' || !choices.has(value)) {
    throw new Error(
      `${context} must be one of: ${[...choices].join(', ')}`
    )
  }
  return value
}

function requireBoolean(value, context) {
  if (typeof value !== 'boolean') {
    throw new Error(`${context} must be a boolean`)
  }
  return value
}

function assertVersion(value, context) {
  if (value !== 1) throw new Error(`${context} must be 1`)
}

function assertTimezone(value) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format()
  } catch {
    throw new Error(`Invalid IANA timezone: ${value}`)
  }
}

function assertUnique(values, context) {
  if (new Set(values).size !== values.length) {
    throw new Error(`${context} contains duplicate values`)
  }
}

function exactKeys(value, allowedKeys, context) {
  const allowed = new Set(allowedKeys)
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`${context} contains unknown field: ${key}`)
    }
  }
}

function pad(value) {
  return String(value).padStart(2, '0')
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const result = await generateScheduleContent()
  console.log(
    `Generated schedule data: ${result.eventCount} events, ` +
      `${result.assignmentCount} assignments.`
  )
}
