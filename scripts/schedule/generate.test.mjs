import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildScheduleData,
  renderAssignmentCalendarIcs,
  renderCalendarIcs
} from './generate.mjs'

const schedule = {
  version: 1,
  timezone: 'Asia/Shanghai',
  siteUrl: 'https://example.com',
  events: [
    {
      id: 'session-01',
      type: 'lecture',
      topic: 'kernel',
      sessions: ['01'],
      title: { zh: '第一讲', en: 'Session 1' },
      start: '2026-08-01T19:00:00+08:00',
      end: '2026-08-01T21:00:00+08:00',
      confirmation: 'confirmed',
      locations: [
        {
          label: { zh: '腾讯会议', en: 'Tencent Meeting' }
        },
        {
          label: { zh: 'LCPU Live' },
          href: 'https://live.lcpu.dev'
        },
        {
          label: { zh: '课程回放' },
          href: 'https://example.com/replay'
        }
      ],
      links: [
        {
          label: { zh: '课程讲义', en: 'Course notes' },
          href: '/wiki/session-01'
        }
      ],
      assignments: ['A01']
    }
  ]
}

const assignments = {
  version: 1,
  assignments: [
    {
      id: 'A01',
      title: { zh: 'CUDA 练习', en: 'CUDA exercise' },
      release: '2026-08-01',
      due: '2026-08-07T23:59:00+08:00'
    }
  ]
}

test('normalizes events and links assignment ids', () => {
  const generated = buildScheduleData(schedule, assignments)
  assert.equal(generated.events[0].startAt, '2026-08-01T11:00:00Z')
  assert.equal(generated.events[0].timeLabel, '19:00–21:00')
  assert.deepEqual(generated.events[0].locations[0], {
    label: { zh: '腾讯会议', en: 'Tencent Meeting' }
  })
  assert.equal(
    generated.events[0].locations[2].href,
    'https://example.com/replay'
  )
  assert.deepEqual(generated.events[0].links[0], {
    label: { zh: '课程讲义', en: 'Course notes' },
    href: '/wiki/session-01'
  })
  assert.deepEqual(generated.assignments[0].eventIds, ['session-01'])
  assert.equal(generated.assignments[0].due.at, '2026-08-07T15:59:00Z')
})

test('preserves guest lectures as a distinct calendar event type', () => {
  const generated = buildScheduleData(
    {
      ...schedule,
      events: [
        {
          ...schedule.events[0],
          type: 'guest-lecture'
        }
      ]
    },
    assignments
  )
  assert.equal(generated.events[0].type, 'guest-lecture')
  assert.match(renderCalendarIcs(generated), /CATEGORIES:AI INFRA,guest-lecture/)
})

test('rejects unknown assignment references', () => {
  assert.throws(
    () =>
      buildScheduleData(
        {
          ...schedule,
          events: [
            {
              ...schedule.events[0],
              assignments: ['A99']
            }
          ]
        },
        assignments
      ),
    /unknown assignment A99/
  )
})

test('generates course and assignment ICS feeds with stable deadline events', () => {
  const generated = buildScheduleData(schedule, assignments)
  const calendar = renderCalendarIcs(generated)
  const unfoldedCalendar = calendar.replace(/\r\n /g, '')
  const deadlines = renderAssignmentCalendarIcs(generated)

  assert.match(calendar, /\r\n/)
  assert.match(calendar, /UID:event-session-01@/)
  assert.match(calendar, /UID:assignment-A01@/)
  assert.match(calendar, /SUMMARY:\[DDL\] A01 · CUDA 练习/)
  assert.match(calendar, /DTSTART:20260807T155900Z/)
  assert.match(calendar, /LOCATION:腾讯会议 · LCPU Live · 课程回放/)
  assert.match(unfoldedCalendar, /LCPU Live: https:\/\/live\.lcpu\.dev/)
  assert.match(
    unfoldedCalendar,
    /课程回放: https:\/\/example\.com\/replay/
  )
  assert.match(
    calendar,
    /URL:https:\/\/example\.com\/wiki\/session-01/
  )
  assert.match(deadlines, /Assignment Deadlines/)
  assert.doesNotMatch(deadlines, /UID:event-session-01@/)
})

test('treats all-day event end dates as inclusive in YAML and exclusive in ICS', () => {
  const generated = buildScheduleData(
    {
      version: 1,
      timezone: 'Asia/Shanghai',
      siteUrl: 'https://example.com',
      events: [
        {
          id: 'summer-workshop',
          type: 'workshop',
          title: { zh: '两日工作坊' },
          start: '2026-08-08',
          end: '2026-08-09',
          confirmation: 'confirmed'
        }
      ]
    },
    { version: 1, assignments: [] }
  )
  assert.equal(generated.events[0].endDate, '2026-08-10')
  assert.match(renderCalendarIcs(generated), /DTEND;VALUE=DATE:20260810/)
})
