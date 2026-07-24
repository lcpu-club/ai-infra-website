import assert from 'node:assert/strict'
import test from 'node:test'
import { listCalendars } from './client.mjs'

test('sanitizes SDK request failures without leaking authorization headers', async () => {
  const sdkError = new Error('Request failed with status code 400')
  sdkError.response = {
    data: {
      code: 131006,
      msg: 'permission denied'
    },
    config: {
      headers: {
        Authorization: 'Bearer must-not-leak'
      }
    }
  }
  const client = {
    calendar: {
      v4: {
        calendar: {
          async list() {
            throw sdkError
          }
        }
      }
    }
  }

  await assert.rejects(listCalendars(client), (error) => {
    assert.equal(
      error.message,
      'List calendars failed (131006): permission denied'
    )
    assert.doesNotMatch(String(error.stack), /must-not-leak/)
    return true
  })
})
