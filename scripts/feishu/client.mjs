import { once } from 'node:events'
import { Readable } from 'node:stream'
import * as lark from '@larksuiteoapi/node-sdk'

const FEISHU_MEDIA_HOSTS = new Set([
  'internal-api-drive-stream.feishu.cn'
])

const silentLogger = {
  error() {},
  warn() {},
  info() {},
  debug() {},
  trace() {}
}

export function createFeishuClient({ appId, appSecret }) {
  return new lark.Client({
    appId,
    appSecret,
    appType: lark.AppType.SelfBuild,
    domain: lark.Domain.Feishu,
    // The SDK's default error logger includes the whole Axios request object.
    // Keep it silent and surface only the sanitized errors below.
    loggerLevel: lark.LoggerLevel.fatal,
    logger: silentLogger
  })
}

async function callFeishu(operation, request) {
  try {
    return await request()
  } catch (error) {
    const payload = error?.response?.data
    const code = payload?.code ?? error?.code ?? 'request_failed'
    const message = payload?.msg || error?.message || 'Unknown Feishu API error'
    throw new Error(`${operation} failed (${code}): ${message}`)
  }
}

function assertSuccess(response, operation) {
  if (!response || response.code !== 0) {
    const code = response?.code ?? 'unknown'
    const message = response?.msg || 'Unknown Feishu API error'
    throw new Error(`${operation} failed (${code}): ${message}`)
  }
  return response.data
}

export async function resolveWikiNode(client, wikiNodeToken) {
  const operation = `Resolve Wiki node ${wikiNodeToken}`
  const response = await callFeishu(operation, () =>
    client.wiki.v2.space.getNode({
      params: {
        token: wikiNodeToken,
        obj_type: 'wiki'
      }
    })
  )
  const data = assertSuccess(response, operation)
  const node = data?.node

  if (!node?.obj_token || !node?.obj_type) {
    throw new Error(`Wiki node ${wikiNodeToken} returned no backing document`)
  }
  return node
}

export async function fetchWikiMarkdown(client, wikiNodeToken) {
  const node = await resolveWikiNode(client, wikiNodeToken)

  if (node.obj_type === 'docx') {
    const operation = `Export Wiki document ${wikiNodeToken}`
    const response = await callFeishu(operation, () =>
      client.request({
        method: 'POST',
        url: `/open-apis/docs_ai/v1/documents/${encodeURIComponent(node.obj_token)}/fetch`,
        data: {
          format: 'markdown',
          export_option: {
            export_block_id: false,
            export_style_attrs: false,
            export_cite_extra_data: false
          },
          extra_param: JSON.stringify({
            enable_user_cite_reference_map: true,
            return_html5_block_data: true
          })
        }
      })
    )
    const data = assertSuccess(response, operation)
    const document = data?.document

    if (typeof document?.content !== 'string') {
      throw new Error(`Wiki document ${wikiNodeToken} returned no Markdown content`)
    }

    return {
      markdown: document.content,
      revisionId: document.revision_id ?? null,
      referenceMap: document.reference_map ?? {},
      node
    }
  }

  if (node.obj_type === 'file') {
    const response = await callFeishu(
      `Download Wiki file ${wikiNodeToken}`,
      () =>
        client.drive.v1.file.download({
          path: { file_token: node.obj_token }
        })
    )
    return {
      markdown: (await streamToBuffer(response.getReadableStream())).toString('utf8'),
      revisionId: null,
      referenceMap: {},
      node
    }
  }

  throw new Error(
    `Wiki node ${wikiNodeToken} uses unsupported object type: ${node.obj_type}`
  )
}

export async function listWikiNodes(client, { spaceId, parentNodeToken }) {
  const nodes = []
  let pageToken

  do {
    const operation = `List Wiki nodes in space ${spaceId}`
    const response = await callFeishu(operation, () =>
      client.wiki.v2.spaceNode.list({
        path: { space_id: spaceId },
        params: {
          page_size: 50,
          ...(parentNodeToken ? { parent_node_token: parentNodeToken } : {}),
          ...(pageToken ? { page_token: pageToken } : {})
        }
      })
    )
    const data = assertSuccess(response, operation)
    nodes.push(...(data?.items ?? []))
    pageToken = data?.has_more ? data.page_token : undefined
  } while (pageToken)

  return nodes
}

export async function downloadDocumentMedia(client, fileToken) {
  const response = await callFeishu(`Download document media ${fileToken}`, () =>
    client.drive.v1.media.download({
      path: { file_token: fileToken }
    })
  )
  const buffer = await streamToBuffer(response.getReadableStream())
  const headers =
    typeof response.headers?.toJSON === 'function'
      ? response.headers.toJSON()
      : response.headers ?? {}

  return {
    buffer,
    contentType: String(headers['content-type'] ?? 'application/octet-stream'),
    contentDisposition: String(headers['content-disposition'] ?? '')
  }
}

export async function downloadFeishuMediaUrl(sourceUrl) {
  let url
  try {
    url = new URL(sourceUrl)
  } catch {
    throw new Error('Download hosted Feishu media failed: invalid URL')
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    !FEISHU_MEDIA_HOSTS.has(url.hostname)
  ) {
    throw new Error('Download hosted Feishu media failed: untrusted URL')
  }

  let response
  try {
    response = await fetch(url, {
      redirect: 'error',
      signal: AbortSignal.timeout(30_000)
    })
  } catch (error) {
    throw new Error(
      `Download hosted Feishu media failed: ${error?.message || 'request failed'}`
    )
  }
  if (!response.ok) {
    throw new Error(
      `Download hosted Feishu media failed (${response.status}): HTTP error`
    )
  }
  if (!response.body) {
    throw new Error('Download hosted Feishu media failed: empty response')
  }

  return {
    buffer: await streamToBuffer(Readable.fromWeb(response.body)),
    contentType: String(
      response.headers.get('content-type') ?? 'application/octet-stream'
    ),
    contentDisposition: String(
      response.headers.get('content-disposition') ?? ''
    )
  }
}

export async function listCalendars(client) {
  const calendars = []
  let pageToken

  do {
    const response = await callFeishu('List calendars', () =>
      client.calendar.v4.calendar.list({
        params: {
          page_size: 50,
          ...(pageToken ? { page_token: pageToken } : {})
        }
      })
    )
    const data = assertSuccess(response, 'List calendars')
    calendars.push(...(data?.calendar_list ?? []))
    pageToken = data?.has_more ? data.page_token : undefined
  } while (pageToken)

  return calendars
}

export async function listCalendarEvents(
  client,
  { calendarId, startTimestamp, endTimestamp }
) {
  const events = []
  let pageToken

  do {
    const operation = `List events in calendar ${calendarId}`
    const response = await callFeishu(operation, () =>
      client.calendar.v4.calendarEvent.list({
        path: { calendar_id: calendarId },
        params: {
          page_size: 50,
          start_time: String(startTimestamp),
          end_time: String(endTimestamp),
          ...(pageToken ? { page_token: pageToken } : {})
        }
      })
    )
    const data = assertSuccess(response, operation)
    events.push(...(data?.items ?? []))
    pageToken = data?.has_more ? data.page_token : undefined
  } while (pageToken)

  return events
}

async function streamToBuffer(stream, maximumBytes = 25 * 1024 * 1024) {
  const chunks = []
  let size = 0

  stream.on('data', (chunk) => {
    size += chunk.length
    if (size > maximumBytes) {
      stream.destroy(
        new Error(`Feishu media exceeds the ${maximumBytes} byte download limit`)
      )
      return
    }
    chunks.push(Buffer.from(chunk))
  })

  await once(stream, 'end')
  return Buffer.concat(chunks)
}
