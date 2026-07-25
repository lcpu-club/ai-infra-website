/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静态导出，产物在 out/，可直接挂 GitHub Pages
  output: 'export',
  // GitHub Pages 项目子路径，与 VitePress base 保持一致
  basePath: '/ai-infra-website',
  trailingSlash: true,
  images: {
    // 静态导出无法使用 Next 图片优化服务
    unoptimized: true
  },
  // 与 VitePress 产物合并部署，无需 Next 自带 404 抢占子路径
  skipTrailingSlashRedirect: true
}

export default nextConfig
