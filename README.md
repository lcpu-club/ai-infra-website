# AI Infra Seminars 2026

Weiming HPC Training Camp × LCPU AI Infra Seminars 课程网站。

## 本地开发

```bash
npm install
npm run dev
```

## 飞书同步

飞书是动态课程内容的来源：

- Wiki 集合负责整棵讲义目录；网站“课程资料”导航直接显示根节点下的子页面标题。
- 课程共享日历中的全部事件直接生成首页和 `/schedule` 活动日历，负责标题、
  说明、日期、时间、地点和状态。
- `docs/.vitepress/data/program.ts` 保留 Topic、讲者、提纲等网站策划字段。
- 腾讯会议链接默认不发布，只有将
  `content/feishu/sessions.json` 中的 `publishMeetingUrl` 显式设为
  `true` 才会进入公开网站。

同步使用飞书官方 Node SDK。生产环境只需要应用身份，不需要保存个人登录
token。

### 本地凭据

凭据通过环境变量提供：

```text
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=xxx
FEISHU_CALENDAR_ID=xxx
```

本地可放在仓库根目录的 `.env.feishu.local`；该文件已被 Git 忽略且应保持
`0600` 权限。创建新的只读应用可运行：

```bash
node scripts/feishu/register-app.mjs
```

应用运行期权限：

- `wiki:wiki:readonly`
- `docx:document:readonly`
- `docs:document.media:download`
- `calendar:calendar:read`
- `calendar:calendar.event:read`
- `calendar:calendar.acl:read`

API Scope 之外，应用还必须拥有目标知识空间的资源权限。进入知识空间的
「设置 → 权限设置/成员设置」把应用加入可查看成员；如果界面不能直接选择
应用，可以先把应用作为机器人加入一个飞书群，再把该群加入知识空间成员。
否则列举知识空间顶层节点会返回 `131006 wiki space permission denied`。
只把单篇页面共享给应用时，应用可能可以读取该页面及其后代，但这不等于拥有
整个知识空间的遍历权限。

### 内容映射

编辑 `content/feishu/sessions.json`。`wiki` 配置用于递归同步一个根页面及其
全部后代：

```json
{
  "wiki": {
    "rootNodeToken": "CWcAw7BUai4MimkMFzEcmV6on7f",
    "sourceBaseUrl": "https://lcpu-club.feishu.cn/wiki",
    "title": "AI Infra Wiki"
  },
  "sessions": []
}
```

同步器会识别飞书 `<sub-page-list>` 目录块，递归获取所有后代页面，保留层级并
生成 `/wiki/` 导航。页面 URL 使用稳定的 Wiki node token，移动或改名不会
破坏外部链接。

`sessions` 列表是可选的单节课程映射；不需要独立 Session 页面时保持空数组。
配置单节映射时可使用：

- `wikiNodeToken`：Wiki URL 中 `/wiki/` 后的 token。
- `calendarEventId`：可选。填写后会把共享日历中的该事件链接到对应讲义页；
  不填写也不影响事件出现在活动日历中。
- `pageTitle` 和 `description`：日历尚未配置时使用的页面元数据。

共享日历时间范围内的所有事件都会写入生成快照，并按日期与时间排序。定时
事件、全天事件、描述、地点、待确认/已确认/已取消状态都会自动反映到网站；
腾讯会议链接仍受 `publishMeetingUrl` 开关保护。

先查看应用可见的日历、日程 ID 和 Wiki 版本：

```bash
npm run inspect:feishu
```

预演和正式同步：

```bash
npm run sync:feishu:dry
npm run sync:feishu
```

同步器会先在临时目录生成完整结果，所有远端读取和格式校验成功后才替换正式
文件。未知飞书 XML Block、危险 HTML、丢失的日程或下载失败都会中止整批更新。
图片与附件下载到对应的 `docs/public/feishu/` 子目录，文件名由内容哈希生成。

生成文件包括：

- `docs/sessions/<session-id>.md`（仅在配置独立 Session 映射时生成）
- `docs/wiki/index.md` 与 `docs/wiki/<wiki-node-token>.md`
- `docs/.vitepress/data/generated/feishu.json`
- `docs/public/feishu/<session-id>/`（仅在配置独立 Session 映射时生成）
- `docs/public/feishu/wiki/<wiki-node-token>/`

不要直接修改这些生成文件；请在飞书 Wiki 或日历中修改。

### GitHub Actions

部署工作流在以下时机先同步、再构建：

- `main` 分支 push
- 每 10 分钟定时轮询
- 手动触发
- `repository_dispatch` 的 `feishu-content-changed` 事件

在 GitHub 仓库中配置 Actions secrets：

- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`
- `FEISHU_CALENDAR_ID`（共享日历准备好后配置）

如果前两个 secret 尚未配置，工作流会使用仓库内最后一次成功同步的快照构建，
不会让现有网站失效。同步或构建失败时，Pages 部署步骤不会运行，线上版本保持
不变。同步后的生成文件会由 `github-actions[bot]` 在构建成功后提交到
`main`，定时轮询发现结果没有变化时会跳过构建与部署。如果 `main` 禁止
GitHub Actions 直接推送，需要在分支保护规则中放行该机器人，或改为自动 PR。

## 验证

```bash
npm run test:feishu
npm run build
npm run preview
```
