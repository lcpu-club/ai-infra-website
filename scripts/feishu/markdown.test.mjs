import assert from 'node:assert/strict'
import test from 'node:test'
import {
  extractSubPageListReferences,
  normalizeFeishuMarkdown
} from './markdown.mjs'

test('strips the leading title and fixes URL escapes for web rendering', async () => {
  const source =
    '# Session 1\n\n## 参考资料\n\nSlides：https://example.com/\\~course/a.pdf\n'
  const output = await normalizeFeishuMarkdown(source, {
    sessionId: '01',
    wikiRoutes: new Map()
  })

  assert.equal(
    output,
    '## 参考资料\n\nSlides：https://example.com/~course/a.pdf\n'
  )
})

test('does not alter escaped URLs inside inline or fenced code', async () => {
  const output = await normalizeFeishuMarkdown(
    '# Title\n\n`https://example.com/\\~inline`\n\n' +
      '```text\nhttps://example.com/\\~fenced\n#include <stdio.h>\n' +
      'kernel<<<grid, block>>>(data);\n```\n',
    {
      sessionId: '01',
      wikiRoutes: new Map()
    }
  )

  assert.match(output, /`https:\/\/example\.com\/\\~inline`/)
  assert.match(output, /https:\/\/example\.com\/\\~fenced/)
  assert.match(output, /#include <stdio\.h>/)
  assert.match(output, /kernel<<<grid, block>>>\(data\);/)
})

test('does not confuse mathematical comparisons with Feishu XML tags', async () => {
  const output = await normalizeFeishuMarkdown(
    '# Title\n\n$a_{n}=\\sum_{i<n}1/(a_i+n)$\n',
    {
      sessionId: '01',
      wikiRoutes: new Map()
    }
  )

  assert.equal(output, '$a_{n}=\\sum_{i<n}1/(a_i+n)$\n')
})

test('keeps bold Feishu labels valid when immediately followed by text', async () => {
  const output = await normalizeFeishuMarkdown(
    '# Title\n\n**活动频率：**半周一次\n\n' +
      '| **推送** | **时间** | **负责人** |\n' +
      '|-|-|-|\n',
    {
      sessionId: '01',
      wikiRoutes: new Map()
    }
  )

  assert.equal(
    output,
    '**活动频率：**&ZeroWidthSpace;半周一次\n\n' +
      '| **推送** | **时间** | **负责人** |\n' +
      '|-|-|-|\n'
  )
})

test('downloads Feishu image tags and renders image components', async () => {
  const calls = []
  const output = await normalizeFeishuMarkdown(
    '# Title\n\n<img src="img_token" caption="架构图" width="800"/>\n',
    {
      sessionId: '01',
      wikiRoutes: new Map(),
      async downloadAsset(input) {
        calls.push(input)
        return { publicPath: '/feishu/01/abc.png' }
      }
    }
  )

  assert.deepEqual(calls, [
    { token: 'img_token', name: undefined, kind: 'img' }
  ])
  assert.equal(
    output,
    '<FeishuImage src="/feishu/01/abc.png" caption="架构图" />\n'
  )
})

test('downloads hosted Feishu Markdown images and leaves other remote images alone', async () => {
  const calls = []
  const sourceUrl =
    'https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=temporary_code'
  const output = await normalizeFeishuMarkdown(
    `# Title\n\n![架构图](${sourceUrl})\n\n![](https://example.com/public.png)\n`,
    {
      sessionId: '01',
      wikiRoutes: new Map(),
      async downloadAsset(input) {
        calls.push(input)
        return { publicPath: '/feishu/01/hosted.png' }
      }
    }
  )

  assert.deepEqual(calls, [
    {
      sourceUrl,
      name: '架构图',
      kind: 'img'
    }
  ])
  assert.equal(
    output,
    '<FeishuImage src="/feishu/01/hosted.png" caption="架构图" />\n\n' +
      '![](https://example.com/public.png)\n'
  )
})

test('restores image captions and dimensions from document block metadata', async () => {
  const sourceUrl =
    'https://internal-api-drive-stream.feishu.cn/space/image?code=test'
  const output = await normalizeFeishuMarkdown(
    `# Title\n\n![](${sourceUrl})\n`,
    {
      sessionId: '01',
      imageMetadata: [
        {
          token: 'img_token',
          caption: 'GPU "执行" 模型',
          width: 1280,
          height: 720
        }
      ],
      wikiRoutes: new Map(),
      async downloadAsset() {
        return {
          publicPath: '/feishu/01/model.png',
          transparent: true
        }
      }
    }
  )

  assert.equal(
    output,
    '<FeishuImage src="/feishu/01/model.png" ' +
      'caption="GPU &quot;执行&quot; 模型" width="1280" height="720" transparent />\n'
  )
})

test('rejects mismatched exported images and block metadata', async () => {
  const sourceUrl =
    'https://internal-api-drive-stream.feishu.cn/space/image?code=test'
  await assert.rejects(
    normalizeFeishuMarkdown(`# Title\n\n![](${sourceUrl})\n`, {
      sessionId: '01',
      imageMetadata: [],
      wikiRoutes: new Map(),
      async downloadAsset() {
        return { publicPath: '/feishu/01/model.png' }
      }
    }),
    /exported more images than its block metadata/
  )
})

test('converts common Feishu extension blocks', async () => {
  const output = await normalizeFeishuMarkdown(
    '# Title\n\n<callout emoji="💡"><p>重点</p></callout>\n' +
      '<checkbox done="true">完成练习</checkbox>\n',
    {
      sessionId: '01',
      wikiRoutes: new Map()
    }
  )

  assert.match(output, /::: info 💡\n\n重点\n\n:::/)
  assert.match(output, /- \[x\] 完成练习/)
})

test('renders Feishu grid columns with their original width ratios', async () => {
  const output = await normalizeFeishuMarkdown(
    '# Title\n\n' +
      '<grid cols="2">' +
      '<column width="0.375"><p>左栏内容</p></column>' +
      '<column width="0.625"><p>右栏内容</p></column>' +
      '</grid>\n',
    {
      sessionId: '01',
      wikiRoutes: new Map()
    }
  )

  assert.match(output, /<FeishuGrid>/)
  assert.match(output, /<FeishuGridColumn width="0\.375">/)
  assert.match(output, /<FeishuGridColumn width="0\.625">/)
  assert.ok(output.indexOf('左栏内容') < output.indexOf('右栏内容'))
  assert.match(output, /<\/FeishuGridColumn>/)
  assert.match(output, /<\/FeishuGrid>/)
})

test('rejects unsupported attributes on Feishu grids', async () => {
  await assert.rejects(
    normalizeFeishuMarkdown(
      '# Title\n\n<grid onclick="alert(1)"><grid-column>x</grid-column></grid>',
      {
        sessionId: '01',
        wikiRoutes: new Map()
      }
    ),
    /unsupported attribute onclick/
  )
})

test('renders Feishu sub-page-list blocks with the discovered Wiki directory', async () => {
  const source =
    '# Wiki\n\n' +
    '<sub-page-list space-id="space_1" wiki-token="root_1">' +
    '<sub-page doc-id="doc_1" file-type="docx" title="Session 00 | 从 HPC 到 AI Infra"/>' +
    '<sub-page doc-id="doc_2" file-type="docx" title="Session 01｜GPU Programming Model"/>' +
    '</sub-page-list>\n'
  const references = extractSubPageListReferences(source)
  const output = await normalizeFeishuMarkdown(source, {
    contextLabel: 'Wiki page Wiki',
    wikiRoutes: new Map(),
    renderSubPageList({ 'wiki-token': wikiToken }) {
      assert.equal(wikiToken, 'root_1')
      return '- [Child](/wiki/child_1)'
    }
  })

  assert.deepEqual(references, [
    { wikiNodeToken: 'root_1', spaceId: 'space_1' }
  ])
  assert.equal(output, '- [Child](/wiki/child_1)\n')
})

test('preserves sanitized Feishu tables and renders user citations', async () => {
  const output = await normalizeFeishuMarkdown(
    '# Title\n\n' +
      '<table><colgroup><col/><col/></colgroup><tbody><tr>' +
      '<td rowspan="2" vertical-align="middle"><b>负责人</b><br/>' +
      '<cite type="user" user-id="ou_123" user-name="魏睿辰"></cite></td>' +
      '<td colspan="2"><ul><li>编译器</li></ul></td>' +
      '</tr></tbody></table>\n',
    {
      sessionId: '01',
      wikiRoutes: new Map()
    }
  )

  assert.match(
    output,
    /<td rowspan="2" style="vertical-align: middle">/
  )
  assert.match(output, /<b>负责人<\/b><br \/>@魏睿辰/)
  assert.match(output, /<td colspan="2"><ul><li>编译器<\/li><\/ul><\/td>/)
})

test('converts Feishu title, task list, chat card, and document citation blocks', async () => {
  const output = await normalizeFeishuMarkdown(
    '<title>飞书导出标题</title>\n\n' +
      '<chat_card name="AI Infra学习小组" chat-id="oc_123"></chat_card>\n\n' +
      '<readonly-block token="task_123" type="task_list"></readonly-block>\n\n' +
      '<cite doc-id="Wiki_123" file-type="wiki" title="会议议程" type="doc"></cite>\n\n' +
      '<cite user-id="ou_hidden" type="user"></cite>\n',
    {
      contextLabel: 'Wiki page 示例',
      wikiRoutes: new Map()
    }
  )

  assert.doesNotMatch(output, /飞书导出标题/)
  assert.match(output, /\*\*飞书群：\*\* AI Infra学习小组/)
  assert.match(output, /> 飞书任务列表请在原文中查看。/)
  assert.match(output, /《会议议程》/)
  assert.match(output, /@飞书用户/)
})

test('rejects unsafe attributes and unsupported markup inside tables', async () => {
  await assert.rejects(
    normalizeFeishuMarkdown(
      '# Title\n\n<table><tbody><tr><td onclick="alert(1)">x</td></tr></tbody></table>',
      {
        sessionId: '01',
        wikiRoutes: new Map()
      }
    ),
    /unsupported attribute onclick/
  )
  await assert.rejects(
    normalizeFeishuMarkdown(
      '# Title\n\n<table><tbody><tr><svg></svg></tr></tbody></table>',
      {
        sessionId: '01',
        wikiRoutes: new Map()
      }
    ),
    /unsupported tag <svg>/
  )
})

test('fails closed for unknown or unsafe embedded blocks', async () => {
  await assert.rejects(
    normalizeFeishuMarkdown('# Title\n\n<whiteboard token="x"/>', {
      sessionId: '01',
      wikiRoutes: new Map()
    }),
    /unsupported Feishu block <whiteboard>/
  )
  await assert.rejects(
    normalizeFeishuMarkdown('# Title\n\n<script>alert(1)</script>', {
      sessionId: '01',
      wikiRoutes: new Map()
    }),
    /unsafe raw HTML/
  )
  await assert.rejects(
    normalizeFeishuMarkdown('# Title\n\n`<whiteboard token="code"/>`\n\n<canvas/>', {
      sessionId: '01',
      wikiRoutes: new Map()
    }),
    /unsupported Feishu block <canvas>/
  )
  await assert.rejects(
    normalizeFeishuMarkdown(
      '# Title\n\n' +
        '<sub-page-list space-id="space_1" wiki-token="root_1">' +
        '<whiteboard token="nested"/>' +
        '</sub-page-list>',
      {
        sessionId: '01',
        wikiRoutes: new Map(),
        renderSubPageList() {
          return ''
        }
      }
    ),
    /sub-page-list contains unsupported content/
  )
})
