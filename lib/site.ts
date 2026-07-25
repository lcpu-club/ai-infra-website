// 站点级常量与跨应用链接工具。
// Next(主页+日历) 与 VitePress(内容页) 部署在同一 GitHub Pages 子路径下，
// 指向 VitePress 的链接必须带上 basePath 且使用普通 <a>（整页跳转，非 Next 客户端路由）。

export const BASE_PATH = '/ai-infra-website'
const VITEPRESS_DEV_ORIGIN = 'http://localhost:3211'

export const SITE = {
  title: 'AI Infra Seminars',
  titleCn: 'AI 基础设施系列研讨',
  org: '北京大学学生 Linux 俱乐部 · 未名超算',
  season: '2026 暑期',
  feishuWiki: 'https://lcpu-club.feishu.cn/wiki/SURAw8B4riKkhRkUKPYc43k7nHf'
}

/** 生成指向 VitePress 内容页的完整路径（带 basePath）。 */
export function docHref(path: string): string {
  if (!path) return BASE_PATH + '/'
  if (/^https?:\/\//.test(path)) return path
  const clean = path.startsWith('/') ? path : `/${path}`

  // 开发时文档仍由独立的 VitePress 服务渲染；部署后回到同一 GitHub Pages 子路径。
  return process.env.NODE_ENV === 'development'
    ? `${VITEPRESS_DEV_ORIGIN}${BASE_PATH}${clean}`
    : `${BASE_PATH}${clean}`
}
