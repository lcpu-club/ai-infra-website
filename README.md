# AI Infra Seminars 2026

Weiming HPC Training Camp × LCPU AI Infra Seminars 课程网站。

## 中英双语

- 中文页面保留原有路径；英文页面使用 `/en/` 前缀，并通过导航栏语言菜单切换。
- 首页、活动日历和共用组件的静态文案集中在
  `docs/.vitepress/data/site-i18n.ts`。
- 飞书同步只生成中文 `docs/wiki/`；人工翻译维护在
  `docs/en/wiki/`，同步时不会被覆盖。
- 新增或改名 Wiki 页面时，在 `docs/.vitepress/config.mts` 的
  `englishWikiTitles` 中补充英文导航标题，并在 `docs/en/wiki/` 创建同 token
  的英文页面。
- 日程与作业的英文内容直接写在 YAML 的 `en` 字段中；该字段可选，缺少时
  英文页面会回退到中文。

## 本地开发

```bash
npm install
npm run dev
```

## 日程与作业

课程日程与作业是仓库内的结构化内容：

- `content/schedule.yaml`：活动、时间、讲者、地点、链接以及关联作业 ID。
- `content/assignments.yaml`：作业标题、说明、发布时间、DDL 和相关链接。
- 对应的 `*.schema.json` 为编辑器提供补全，并由生成脚本再次严格校验。
- 两份 YAML 底部都提供了注释模板，复制后移除行首 `#` 即可新增内容。

日程中的 `assignments: [A01]` 只保存稳定 ID，作业详情集中维护，避免标题、
链接和 DDL 在多个活动中重复。`title`、`description`、`label` 和讲者
都支持 `{ zh, en }`；`en` 可省略。

每个活动的 `locations` 是地点或参与方式列表。腾讯会议、直播平台和课程回放
都属于 location；每项只需填写 `label`，有可访问地址时再填写可选的 `href`。
活动的 `links` 用于讲义等普通资料链接，不再按 `notes`、`replay` 等用途
分类。

活动类型使用 `type: lecture` 或 `type: guest-lecture` 区分课程讲座与嘉宾
讲座；网站日历会为这两类活动和作业 DDL 分别使用不同颜色。

生成并验证数据：

```bash
npm run generate:schedule
npm run test:schedule
```

生成目标包括：

- `docs/.vitepress/data/generated/schedule.json`
- `docs/public/calendar.ics`（课程活动和所有作业 DDL）
- `docs/public/assignments.ics`（只包含作业 DDL）

DDL 使用普通日历事件发布，而不是兼容性较差的 `VTODO`。使用日期时显示为
全天截止项，使用带时区的 ISO 时间时显示为 15 分钟的透明日历事件。

## 飞书同步

飞书只作为课程讲义的来源：

- Wiki 集合负责整棵讲义目录；网站“课程资料”导航直接显示根节点下的子页面标题。
- 活动日历与作业不会读取飞书数据。

同步使用飞书官方 Node SDK。生产环境只需要应用身份，不需要保存个人登录
token。

### 本地凭据

凭据通过环境变量提供：

```text
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=xxx
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
- `pageTitle` 和 `description`：独立 Session 页面使用的页面元数据。

查看应用可见的 Wiki 目录和版本：

```bash
npm run inspect:feishu
```

预演和正式同步：

```bash
npm run sync:feishu:dry
npm run sync:feishu
```

同步器会先在临时目录生成完整结果，所有远端读取和格式校验成功后才替换正式
文件。未知飞书 XML Block、危险 HTML 或下载失败都会中止整批更新。
图片与附件下载到对应的 `docs/public/feishu/` 子目录，文件名由内容哈希生成。

生成文件包括：

- `docs/sessions/<session-id>.md`（仅在配置独立 Session 映射时生成）
- `docs/wiki/index.md` 与 `docs/wiki/<wiki-node-token>.md`
- `docs/.vitepress/data/generated/feishu.json`
- `docs/public/feishu/<session-id>/`（仅在配置独立 Session 映射时生成）
- `docs/public/feishu/wiki/<wiki-node-token>/`

不要直接修改这些生成文件；讲义请在飞书 Wiki 中修改，日程和作业请修改
`content/*.yaml`。

### GitHub Actions

部署工作流在以下时机先同步、再构建：

- `main` 分支 push
- 每 10 分钟定时轮询
- 手动触发
- `repository_dispatch` 的 `feishu-content-changed` 事件

在 GitHub 仓库中配置 Actions secrets：

- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`

如果前两个 secret 尚未配置，工作流会使用仓库内最后一次成功同步的快照构建，
不会让现有网站失效。同步或构建失败时，Pages 部署步骤不会运行，线上版本保持
不变。同步后的生成文件会由 `github-actions[bot]` 在构建成功后提交到
`main`，定时轮询发现结果没有变化时会跳过构建与部署。如果 `main` 禁止
GitHub Actions 直接推送，需要在分支保护规则中放行该机器人，或改为自动 PR。

## 验证

```bash
npm test
npm run build
npm run preview
```
