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
