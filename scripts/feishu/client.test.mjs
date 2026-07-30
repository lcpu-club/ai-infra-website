import assert from 'node:assert/strict'
import test from 'node:test'
import {
  downloadFeishuMediaUrl,
  fetchWikiMarkdown,
  listWikiNodes
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
    wiki: {
      v2: {
        spaceNode: {
          async list() {
            throw sdkError
          }
        }
      }
    }
  }

  await assert.rejects(
    listWikiNodes(client, { spaceId: 'space_01' }),
    (error) => {
      assert.equal(
        error.message,
        'List Wiki nodes in space space_01 failed (131006): permission denied'
      )
      assert.doesNotMatch(String(error.stack), /must-not-leak/)
      return true
    }
  )
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

test('combines Markdown export with paginated image block metadata', async () => {
  const blockRequests = []
  const client = {
    wiki: {
      v2: {
        space: {
          async getNode() {
            return {
              code: 0,
              data: {
                node: {
                  obj_token: 'doc_01',
                  obj_type: 'docx',
                  title: 'Session 01'
                }
              }
            }
          }
        }
      }
    },
    async request() {
      return {
        code: 0,
        data: {
          document: {
            content: '# Session 01\n\n![](https://example.com/image.png)',
            revision_id: 7,
            reference_map: {}
          }
        }
      }
    },
    docx: {
      v1: {
        documentBlock: {
          async list(request) {
            blockRequests.push(request)
            if (!request.params.page_token) {
              return {
                code: 0,
                data: {
                  has_more: true,
                  page_token: 'next',
                  items: [{ block_type: 2, text: { elements: [] } }]
                }
              }
            }
            return {
              code: 0,
              data: {
                has_more: false,
                items: [
                  {
                    block_type: 27,
                    image: {
                      token: 'img_01',
                      caption: { content: '  架构图  ' },
                      width: 1280,
                      height: 720
                    }
                  }
                ]
              }
            }
          }
        }
      }
    }
  }

  const document = await fetchWikiMarkdown(client, 'wiki_01')

  assert.equal(blockRequests.length, 2)
  assert.equal(blockRequests[0].params.document_revision_id, -1)
  assert.equal(blockRequests[1].params.page_token, 'next')
  assert.deepEqual(document.imageMetadata, [
    {
      token: 'img_01',
      caption: '架构图',
      width: 1280,
      height: 720
    }
  ])
})
