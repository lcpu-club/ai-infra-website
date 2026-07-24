import assert from 'node:assert/strict'
import test from 'node:test'
import {
  breadcrumbsForWikiPage,
  discoverWikiCollection,
  renderWikiDirectoryMarkdown,
  wikiRouteForToken
} from './wiki.mjs'

test('discovers every descendant referenced by a Feishu sub-page-list', async () => {
  const nodes = {
    source_root: {
      node_token: 'source_root',
      space_id: 'space_1',
      title: 'Source root',
      obj_type: 'docx',
      has_child: true
    },
    page_a: {
      node_token: 'page_a',
      space_id: 'space_1',
      title: 'Page A',
      obj_type: 'docx',
      has_child: true
    },
    page_b: {
      node_token: 'page_b',
      space_id: 'space_1',
      title: 'Page B',
      obj_type: 'docx',
      has_child: false
    },
    page_a_1: {
      node_token: 'page_a_1',
      space_id: 'space_1',
      title: 'Page A.1',
      obj_type: 'docx',
      has_child: false
    }
  }

  const collection = await discoverWikiCollection({
    rootNodeToken: 'public_root',
    async fetchDocument() {
      return {
        markdown:
          '# Collection\n\n' +
          '<sub-page-list space-id="space_1" wiki-token="source_root"></sub-page-list>',
        revisionId: 3,
        node: {
          node_token: 'public_root',
          space_id: 'public_space',
          title: 'Collection',
          obj_type: 'docx',
          has_child: false
        }
      }
    },
    async resolveNode(token) {
      return nodes[token]
    },
    async listNodes({ parentNodeToken }) {
      if (parentNodeToken === 'source_root') {
        return [nodes.page_a, nodes.page_b]
      }
      if (parentNodeToken === 'page_a') return [nodes.page_a_1]
      return []
    }
  })

  assert.deepEqual(
    collection.pages.map(({ node, parentWikiNodeToken, depth }) => ({
      token: node.node_token,
      parentWikiNodeToken,
      depth
    })),
    [
      { token: 'page_a', parentWikiNodeToken: null, depth: 0 },
      { token: 'page_a_1', parentWikiNodeToken: 'page_a', depth: 1 },
      { token: 'page_b', parentWikiNodeToken: null, depth: 0 }
    ]
  )
  assert.deepEqual(collection.rootAliases, ['public_root', 'source_root'])
  assert.equal(
    renderWikiDirectoryMarkdown({
      directoryToken: 'source_root',
      directoryChildren: collection.directoryChildren,
      pageByToken: collection.pageByToken
    }),
    '- [Page A](/wiki/page_a)\n' +
      '  - [Page A.1](/wiki/page_a_1)\n' +
      '- [Page B](/wiki/page_b)'
  )
  assert.deepEqual(
    breadcrumbsForWikiPage(collection.pageByToken.get('page_a_1'), collection.pageByToken),
    [{ title: 'Page A', route: '/wiki/page_a' }]
  )
})

test('rejects unsafe Wiki route tokens', () => {
  assert.throws(() => wikiRouteForToken('../secret'), /Invalid Wiki route token/)
})
