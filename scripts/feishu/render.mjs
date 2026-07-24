export function renderSessionPage({ session, body }) {
  const title = session.pageTitle || `Session ${session.id}`
  const description =
    session.description || `${title} · AI Infra Seminars 2026`

  return `---
title: ${JSON.stringify(title)}
description: ${JSON.stringify(description)}
outline: deep
lastUpdated: false
---

<!-- 此文件由 npm run sync:feishu 生成，请在飞书 Wiki 中编辑正文。 -->

<SessionHeader session-id="${session.id}" />

${body.trim()}
`
}

export function renderWikiPage({
  title,
  body,
  breadcrumbs = [],
  sourceUrl,
  collectionTitle
}) {
  const safeTitle = singleLine(title || '未命名页面')
  const safeCollectionTitle = singleLine(collectionTitle || 'Wiki 讲义')
  const breadcrumbItems = [
    { title: safeCollectionTitle, route: '/wiki/' },
    ...breadcrumbs
  ]
  const breadcrumb = breadcrumbItems
    .map(
      ({ title: itemTitle, route }) =>
        `[${escapeMarkdownInline(singleLine(itemTitle))}](${route})`
    )
    .join(' / ')

  return `---
title: ${JSON.stringify(safeTitle)}
description: ${JSON.stringify(`${safeTitle} · ${safeCollectionTitle}`)}
outline: deep
lastUpdated: false
---

<!-- 此文件由 npm run sync:feishu 生成，请在飞书 Wiki 中编辑正文。 -->

${breadcrumb}

# ${escapeMarkdownInline(safeTitle)}

[在飞书中查看原文 ↗](${sourceUrl})

${body.trim()}
`
}

function singleLine(value) {
  return String(value).replace(/[\u0000-\u001f\u007f]+/g, ' ').trim()
}

function escapeMarkdownInline(value) {
  return String(value).replace(/[\\`*_[\]<>]/g, '\\$&')
}
