export function renderSessionPage({ session, body }) {
  const title = session.pageTitle || `Session ${session.id}`
  const description =
    session.description || `${title} · Infra Seminars 2026`

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
  collectionTitle
}) {
  const safeTitle = singleLine(title || '未命名页面')
  const safeCollectionTitle = singleLine(collectionTitle || 'Wiki 讲义')
  const breadcrumbItems =
    breadcrumbs.length > 0
      ? [{ title: safeCollectionTitle, route: '/wiki/' }, ...breadcrumbs]
      : []
  const breadcrumb = breadcrumbItems
    .map(
      ({ title: itemTitle, route }) =>
        `<a href="${escapeHtml(route)}">${escapeHtml(singleLine(itemTitle))}</a>`
    )
    .join('<span aria-hidden="true">/</span>')
  const breadcrumbBlock = breadcrumb
    ? `  <nav class="wiki-breadcrumb" aria-label="文档路径">${breadcrumb}</nav>\n`
    : ''
  const trimmedBody = body.trim()
  const bodyBlock = trimmedBody ? `\n\n${trimmedBody}` : ''

  return `---
title: ${JSON.stringify(safeTitle)}
description: ${JSON.stringify(`${safeTitle} · ${safeCollectionTitle}`)}
outline: deep
lastUpdated: false
---

<!-- 此文件由 npm run sync:feishu 生成，请在飞书 Wiki 中编辑正文。 -->

<header class="session-banner wiki-page-banner">
${breadcrumbBlock}  <span class="section-index">课程资料</span>
  <h1>${escapeHtml(safeTitle)}</h1>
</header>${bodyBlock}
`
}

function singleLine(value) {
  return String(value).replace(/[\u0000-\u001f\u007f]+/g, ' ').trim()
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
