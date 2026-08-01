import assert from 'node:assert/strict'
import test from 'node:test'
import { renderWikiPage } from './render.mjs'

test('renders Wiki pages with the shared title banner and no Feishu source link', () => {
  const output = renderWikiPage({
    title: 'GPU <模型> & 编程',
    body: '## 正文\n\n内容',
    collectionTitle: '课程 Wiki',
    breadcrumbs: [{ title: '主题一', route: '/wiki/topic-1' }]
  })

  assert.match(output, /<header class="session-banner wiki-page-banner">/)
  assert.match(
    output,
    /<nav class="wiki-breadcrumb" aria-label="文档路径"><a href="\/wiki\/">课程 Wiki<\/a><span aria-hidden="true">\/<\/span><a href="\/wiki\/topic-1">主题一<\/a><\/nav>/
  )
  assert.match(output, /<h1>GPU &lt;模型&gt; &amp; 编程<\/h1>/)
  assert.doesNotMatch(output, /<span class="section-index">课程资料<\/span>/)
  assert.ok(
    output.indexOf('<nav class="wiki-breadcrumb"') >
      output.indexOf('<header class="session-banner wiki-page-banner">')
  )
  assert.ok(
    output.indexOf('<nav class="wiki-breadcrumb"') <
      output.indexOf('<h1>GPU &lt;模型&gt; &amp; 编程</h1>')
  )
  assert.doesNotMatch(output, /在飞书中查看原文/)
  assert.doesNotMatch(output, /^# GPU/m)
})

test('does not add a self-referencing breadcrumb to the Wiki root page', () => {
  const output = renderWikiPage({
    title: '课程 Wiki',
    body: '根页面',
    collectionTitle: '课程 Wiki'
  })

  assert.doesNotMatch(output, /class="wiki-breadcrumb"/)
})

test('renders presenter metadata inside the Wiki title banner', () => {
  const output = renderWikiPage({
    title: '并行计算与并行编程',
    presenter: '@陈嘉骏',
    replay: {
      label: 'Session 1.0 回放',
      url: 'https://www.bilibili.com/video/BV1test'
    },
    body: '正文',
    collectionTitle: '课程 Wiki'
  })

  assert.match(
    output,
    /<div class="session-banner-meta wiki-page-banner-meta"><span class="session-banner-meta-item"><b>主讲：<\/b>@陈嘉骏<\/span><span class="session-banner-meta-item"><b>回放：<\/b><a href="https:\/\/www\.bilibili\.com\/video\/BV1test" target="_blank" rel="noreferrer">Session 1\.0 回放<\/a><\/span><\/div>/
  )
  assert.ok(
    output.indexOf('wiki-page-banner-meta') < output.indexOf('</header>')
  )
})

test('ends an empty Wiki page without extra blank lines', () => {
  const output = renderWikiPage({
    title: '空目录',
    body: '',
    collectionTitle: '课程 Wiki'
  })

  assert.match(output, /<\/header>\n$/)
  assert.doesNotMatch(output, /\n\n$/)
})
