import assert from 'node:assert/strict'
import test from 'node:test'
import { stableSnapshotJson } from './snapshot.mjs'

test('preserves calendar and Wiki data while ordering session ids', () => {
  const output = JSON.parse(
    stableSnapshotJson({
      version: 1,
      sessions: {
        '02': { document: { revisionId: 2 } },
        '01': { document: { revisionId: 1 } }
      },
      calendar: {
        timezone: 'Asia/Shanghai',
        events: [{ eventId: 'event_01' }]
      },
      wiki: {
        title: 'AI Infra Wiki'
      }
    })
  )

  assert.deepEqual(Object.keys(output.sessions), ['01', '02'])
  assert.deepEqual(output.calendar.events, [{ eventId: 'event_01' }])
  assert.equal(output.wiki.title, 'AI Infra Wiki')
})
