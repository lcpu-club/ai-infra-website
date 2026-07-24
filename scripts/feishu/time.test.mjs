import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calendarEventsToPublicData,
  dateRangeToUnixSeconds,
  eventToPublicData
} from './time.mjs'

test('converts configured dates at midnight in the configured timezone', () => {
  const range = dateRangeToUnixSeconds(
    { start: '2026-07-01', end: '2026-10-01' },
    'Asia/Shanghai'
  )

  assert.equal(
    range.startTimestamp,
    Date.parse('2026-07-01T00:00:00+08:00') / 1000
  )
  assert.equal(
    range.endTimestamp,
    Date.parse('2026-10-01T00:00:00+08:00') / 1000
  )
})

test('normalizes a timed calendar event without publishing meeting URLs by default', () => {
  const event = {
    event_id: 'event_01',
    summary: 'GPU 与 GPU 编程模型',
    start_time: {
      timestamp: String(Date.parse('2026-07-23T19:00:00+08:00') / 1000),
      timezone: 'Asia/Shanghai'
    },
    end_time: {
      timestamp: String(Date.parse('2026-07-23T21:00:00+08:00') / 1000),
      timezone: 'Asia/Shanghai'
    },
    description: '第一行\r\n第二行',
    status: 'confirmed',
    location: { name: '燕园大厦 308' },
    app_link: 'https://applink.feishu.cn/client/calendar/event/detail?key=event_01',
    vchat: { meeting_url: 'https://example.invalid/private-meeting' }
  }

  assert.deepEqual(eventToPublicData(event, 'Asia/Shanghai'), {
    eventId: 'event_01',
    summary: 'GPU 与 GPU 编程模型',
    description: '第一行\n第二行',
    date: '2026-07-23',
    endDate: '2026-07-23',
    startAt: '2026-07-23T11:00:00.000Z',
    endAt: '2026-07-23T13:00:00.000Z',
    allDay: false,
    timeLabel: '19:00–21:00',
    timezone: 'Asia/Shanghai',
    status: 'confirmed',
    location: '燕园大厦 308',
    sourceUrl:
      'https://applink.feishu.cn/client/calendar/event/detail?key=event_01'
  })
})

test('normalizes and sorts timed and all-day calendar events', () => {
  const events = calendarEventsToPublicData(
    [
      {
        event_id: 'all_day',
        summary: '全天活动',
        start_time: { date: '2026-07-25', timezone: 'UTC' },
        end_time: { date: '2026-07-26', timezone: 'UTC' },
        status: 'tentative'
      },
      {
        event_id: 'timed',
        summary: '定时活动',
        start_time: {
          timestamp: String(Date.parse('2026-07-24T07:00:00+08:00') / 1000),
          timezone: 'Asia/Singapore'
        },
        end_time: {
          timestamp: String(Date.parse('2026-07-24T11:15:00+08:00') / 1000),
          timezone: 'Asia/Singapore'
        }
      }
    ],
    'Asia/Shanghai'
  )

  assert.deepEqual(
    events.map(({ eventId, date, endDate, allDay, timeLabel, status }) => ({
      eventId,
      date,
      endDate,
      allDay,
      timeLabel,
      status
    })),
    [
      {
        eventId: 'timed',
        date: '2026-07-24',
        endDate: '2026-07-24',
        allDay: false,
        timeLabel: '07:00–11:15',
        status: 'confirmed'
      },
      {
        eventId: 'all_day',
        date: '2026-07-25',
        endDate: '2026-07-26',
        allDay: true,
        timeLabel: '全天',
        status: 'tentative'
      }
    ]
  )
})

test('rejects duplicate event ids in a calendar response', () => {
  const event = {
    event_id: 'duplicate',
    start_time: { date: '2026-07-25' },
    end_time: { date: '2026-07-26' }
  }

  assert.throws(
    () => calendarEventsToPublicData([event, event], 'Asia/Shanghai'),
    /duplicate event duplicate/
  )
})
