export function dateRangeToUnixSeconds(range, timezone) {
  if (!range) {
    throw new Error('calendarRange is required when calendarId is configured')
  }

  return {
    startTimestamp: zonedDateStartToUnixSeconds(range.start, timezone),
    endTimestamp: zonedDateStartToUnixSeconds(range.end, timezone)
  }
}

export function eventToPublicData(event, timezone, publishMeetingUrl = false) {
  if (!event?.event_id || !event.start_time || !event.end_time) {
    throw new Error('Calendar event is missing id, start_time, or end_time')
  }

  const start = formatEventTime(event.start_time, timezone)
  const end = formatEventTime(event.end_time, timezone)
  const description = normalizeMultilineText(event.description)
  const location = [event.location?.name, event.location?.address]
    .map((value) => value?.trim())
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .join(' · ')
  const status = ['tentative', 'confirmed', 'cancelled'].includes(event.status)
    ? event.status
    : 'confirmed'
  const sourceUrl = safeHttpsUrl(event.app_link)
  const meetingUrl = safeHttpsUrl(event.vchat?.meeting_url)

  return {
    eventId: event.event_id,
    summary: event.summary?.trim() || '',
    ...(description ? { description } : {}),
    date: start.date,
    endDate: end.date,
    startAt: start.iso,
    endAt: end.iso,
    allDay: start.allDay,
    timeLabel: start.allDay ? '全天' : `${start.time}–${end.time}`,
    timezone: start.timezone,
    status,
    ...(location ? { location } : {}),
    ...(sourceUrl ? { sourceUrl } : {}),
    ...(publishMeetingUrl && meetingUrl
      ? { meetingUrl }
      : {})
  }
}

export function calendarEventsToPublicData(
  events,
  timezone,
  publishMeetingUrl = false
) {
  const seen = new Set()
  const normalized = events.map((event) => {
    const output = eventToPublicData(event, timezone, publishMeetingUrl)
    if (seen.has(output.eventId)) {
      throw new Error(`Calendar returned duplicate event ${output.eventId}`)
    }
    seen.add(output.eventId)
    return output
  })

  return normalized.sort(
    (left, right) =>
      calendarSortKey(left).localeCompare(calendarSortKey(right)) ||
      left.eventId.localeCompare(right.eventId)
  )
}

function formatEventTime(value, fallbackTimezone) {
  if (value.date) {
    return {
      date: value.date,
      iso: value.date,
      time: '',
      timezone: fallbackTimezone || value.timezone,
      allDay: true
    }
  }

  const timestamp = Number(value.timestamp)
  if (!Number.isFinite(timestamp)) {
    throw new Error(`Invalid Feishu event timestamp: ${value.timestamp}`)
  }
  const timezone = fallbackTimezone || value.timezone
  const instant = new Date(timestamp * 1000)
  const parts = dateTimeParts(instant, timezone)

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    iso: instant.toISOString(),
    time: `${parts.hour}:${parts.minute}`,
    timezone,
    allDay: false
  }
}

function calendarSortKey(event) {
  return `${event.date}T${
    event.allDay ? '00:00' : event.timeLabel.slice(0, 5)
  }`
}

function normalizeMultilineText(value) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .trim()
}

function safeHttpsUrl(value) {
  if (typeof value !== 'string' || !value) return ''
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.href : ''
  } catch {
    return ''
  }
}

function zonedDateStartToUnixSeconds(date, timezone) {
  const [year, month, day] = date.split('-').map(Number)
  let guess = Date.UTC(year, month - 1, day)

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = dateTimeParts(new Date(guess), timezone)
    const represented = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    )
    const target = Date.UTC(year, month - 1, day)
    guess += target - represented
  }

  return Math.floor(guess / 1000)
}

function dateTimeParts(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date)

  return Object.fromEntries(
    parts
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value])
  )
}
