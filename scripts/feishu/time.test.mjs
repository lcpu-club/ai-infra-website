import assert from 'node:assert/strict'
import test from 'node:test'
import { dateRangeToUnixSeconds, eventToPublicData } from './time.mjs'

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
    status: 'confirmed',
    location: { name: '燕园大厦 308' },
    vchat: { meeting_url: 'https://example.invalid/private-meeting' }
  }

  assert.deepEqual(eventToPublicData(event, 'Asia/Shanghai'), {
    eventId: 'event_01',
    summary: 'GPU 与 GPU 编程模型',
    date: '2026-07-23',
    startAt: '2026-07-23T11:00:00.000Z',
    endAt: '2026-07-23T13:00:00.000Z',
    timeLabel: '19:00–21:00',
    timezone: 'Asia/Shanghai',
    status: 'confirmed',
    location: '燕园大厦 308'
  })
})
