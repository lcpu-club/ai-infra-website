import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import {
  createFeishuClient,
  fetchWikiMarkdown,
  listCalendarEvents,
  listCalendars,
  listWikiNodes,
  resolveWikiNode
} from './client.mjs'
import { readSyncConfig } from './config.mjs'
import { loadLocalEnv, requireFeishuCredentials } from './env.mjs'
import { dateRangeToUnixSeconds } from './time.mjs'
import { discoverWikiCollection, wikiRouteForToken } from './wiki.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '../..')

await loadLocalEnv(repoRoot)
const config = await readSyncConfig(repoRoot)
const client = createFeishuClient(requireFeishuCredentials())

const calendars = await listCalendars(client)
console.log('Calendars visible to the sync application:')
console.table(
  calendars.map((calendar) => ({
    id: calendar.calendar_id,
    name: calendar.summary,
    type: calendar.type,
    role: calendar.role,
    permissions: calendar.permissions
  }))
)

if (config.calendarId) {
  const events = await listCalendarEvents(client, {
    calendarId: config.calendarId,
    ...dateRangeToUnixSeconds(config.calendarRange, config.timezone)
  })
  console.log(`Events in configured calendar ${config.calendarId}:`)
  console.table(
    events.map((event) => ({
      id: event.event_id,
      title: event.summary,
      start: event.start_time?.date || event.start_time?.timestamp,
      status: event.status
    }))
  )
}

if (config.wiki) {
  const collection = await discoverWikiCollection({
    rootNodeToken: config.wiki.rootNodeToken,
    fetchDocument: (token) => fetchWikiMarkdown(client, token),
    resolveNode: (token) => resolveWikiNode(client, token),
    listNodes: ({ spaceId, parentNodeToken }) =>
      listWikiNodes(client, { spaceId, parentNodeToken })
  })
  console.log(
    `Wiki collection: ${collection.rootDocument.node.title} ` +
      `(${collection.pages.length} descendant pages)`
  )
  console.table(
    collection.pages.map(({ node, depth, parentWikiNodeToken }) => ({
      depth,
      title: node.title,
      wikiNodeToken: node.node_token,
      parentWikiNodeToken,
      route: wikiRouteForToken(node.node_token),
      type: node.obj_type
    }))
  )
}

for (const session of config.sessions) {
  if (!session.wikiNodeToken) continue
  const document = await fetchWikiMarkdown(client, session.wikiNodeToken)
  console.log(
    `Session ${session.id} Wiki: ${document.node.title} ` +
      `(revision ${document.revisionId ?? 'n/a'}, ${document.markdown.length} chars)`
  )
  if (document.node.has_child && document.node.space_id) {
    const children = await listWikiNodes(client, {
      spaceId: document.node.space_id,
      parentNodeToken: document.node.node_token
    })
    console.table(
      children.map((node) => ({
        wikiNodeToken: node.node_token,
        title: node.title,
        type: node.obj_type,
        hasChildren: node.has_child
      }))
    )
  }
}
