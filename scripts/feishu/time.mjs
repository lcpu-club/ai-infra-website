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
  const location = [event.location?.name, event.location?.address]
    .map((value) => value?.trim())
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .join(' · ')

  return {
    eventId: event.event_id,
    summary: event.summary?.trim() || '',
    date: start.date,
    startAt: start.iso,
    endAt: end.iso,
    timeLabel: start.allDay ? '全天' : `${start.time}–${end.time}`,
    timezone: start.timezone,
    status: event.status || 'confirmed',
    ...(location ? { location } : {}),
    ...(publishMeetingUrl && event.vchat?.meeting_url
      ? { meetingUrl: event.vchat.meeting_url }
      : {})
  }
}

function formatEventTime(value, fallbackTimezone) {
  if (value.date) {
    return {
      date: value.date,
      iso: value.date,
      time: '',
      timezone: value.timezone || fallbackTimezone,
      allDay: true
    }
  }

  const timestamp = Number(value.timestamp)
  if (!Number.isFinite(timestamp)) {
    throw new Error(`Invalid Feishu event timestamp: ${value.timestamp}`)
  }
  const timezone = value.timezone || fallbackTimezone
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
