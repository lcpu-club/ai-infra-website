import assert from 'node:assert/strict'
import test from 'node:test'
import {
  downloadFeishuMediaUrl,
  listCalendars
} from './client.mjs'

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

test('downloads only allowlisted hosted Feishu media URLs', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url, options) => {
    assert.equal(url.hostname, 'internal-api-drive-stream.feishu.cn')
    assert.equal(options.redirect, 'error')
    return new Response(new Uint8Array([137, 80, 78, 71]), {
      status: 200,
      headers: {
        'content-type': 'image/png',
        'content-length': '4'
      }
    })
  }

  try {
    const media = await downloadFeishuMediaUrl(
      'https://internal-api-drive-stream.feishu.cn/space/image?code=test'
    )
    assert.deepEqual(media.buffer, Buffer.from([137, 80, 78, 71]))
    assert.equal(media.contentType, 'image/png')

    await assert.rejects(
      downloadFeishuMediaUrl('https://example.com/image.png'),
      /untrusted URL/
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})
