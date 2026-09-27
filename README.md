# 题迹

题迹是一个面向个人和小团队的刷题、组卷与答题反馈平台。创建者可以任意创建题目，组成题库或答题活动，通过链接分享；答题者输入显示名即可开始答题，创建者可查看汇总、个人答卷和题目表现。

## 当前范围

- 后端：Cloudflare Workers、Hono、TypeScript、D1
- 交互与 SEO Web：Nuxt 3、Vue 3、TypeScript、Pinia
- 首期语言：`zh-CN`、`en-US`
- 首期题型：选择题（勾 1 个答案为单选，勾 2 个及以上为多选）与判断题
- 登录：用户名 + 密码；答题者不强制注册

## 文档

- [产品需求](docs/01-product-requirements.md)
- [信息架构](docs/02-information-architecture.md)
- [系统架构](docs/03-system-architecture.md)
- [数据模型](docs/04-data-model.md)
- [API 规范](docs/05-api-spec.md)
- [前端开发约定](docs/06-frontend-guidelines.md)
- [SEO 与国际化](docs/07-seo-i18n.md)
- [安全与隐私](docs/08-security-privacy.md)
- [测试与发布](docs/09-testing-and-release.md)
- [路线图](docs/10-roadmap.md)

## 目录

```text
apps/api       Cloudflare Worker + Hono API
apps/web       Nuxt 3 + Vue 3 统一 Web 端（工作台、答题、SEO 公开页）
packages/shared 共享 schema、类型和常量
packages/i18n    共享国际化资源
infra/d1         D1 migration 与种子数据
```

## 开发约定

使用 pnpm workspace。Node.js 20+、pnpm 9+、Wrangler 3+。本地 API 使用 `wrangler dev`，D1 使用本地绑定；前端通过环境变量指向 API。正式部署前必须执行 migration、接口测试和公开分享链路端到端测试。

## 如何运行

### 1. 环境准备

Windows、macOS 或 Linux 均可使用以下工具：

- Node.js 20 或更高版本
- pnpm 9 或更高版本
- Wrangler 3 或更高版本（已作为 API workspace 的开发依赖安装）

检查版本：

```bash
node --version
pnpm --version
pnpm exec wrangler --version
```

### 2. 安装依赖

在项目根目录 `tiji` 执行：

```bash
pnpm install
```

### 3. 初始化本地 D1

API 的 D1 配置位于 `apps/api/wrangler.toml`，迁移文件位于 `infra/d1`。首次运行时执行：

```bash
pnpm --filter @tiji/api exec wrangler d1 migrations apply tiji-db --local
```

如果 Wrangler 提示数据库不存在或需要创建，可先执行：

```bash
pnpm --filter @tiji/api exec wrangler d1 create tiji-db
```

然后将命令输出的正式 `database_id` 写入 `apps/api/wrangler.toml`。本地开发仍可使用当前的 `database_id = "local"` 配置。

### 4. 启动 API

打开一个终端，在项目根目录执行：

```bash
pnpm --filter @tiji/api exec wrangler dev
```

API 固定运行在 `http://localhost:8799`（配置见 `apps/api/wrangler.toml` 的 `[dev] port`，避开 8787 上其他项目的 wrangler dev）。健康检查：

```bash
curl http://localhost:8799/api/v1/health
```

Windows PowerShell 可使用：

```powershell
Invoke-WebRequest http://localhost:8799/api/v1/health
```

看到 `"ok":true` 即表示 Worker 和本地 D1 绑定已启动。

### 5. 启动 Web 前端

`apps/web` 是统一的 Nuxt 3 Web 应用，同时承载公开首页、SEO 活动页、登录入口和后续工作台。默认连接 `http://localhost:8799/api/v1`，如需指向其他 API，设置 `NUXT_PUBLIC_API_BASE` 即可：

```bash
# macOS/Linux
pnpm --filter @tiji/web dev
```

Windows PowerShell：

```powershell
pnpm --filter @tiji/web dev
```

默认地址通常为 `http://localhost:3000`。可访问：

- `http://localhost:3000/`：SEO 首页
- `http://localhost:3000/activity/<分享 token>`：公开答题活动页

构建生产版本：

```bash
pnpm --filter @tiji/web build
```

生成静态文件：

```bash
pnpm --filter @tiji/web generate
```


安装依赖后，在根目录执行：

```bash
pnpm check
```

该命令会执行 API、共享包和统一 Web 应用的检查。

### 8. 部署到 Cloudflare

登录 Cloudflare：

```bash
pnpm --filter @tiji/api exec wrangler login
```

应用生产 D1 迁移：

```bash
pnpm --filter @tiji/api exec wrangler d1 migrations apply tiji-db --remote
```

部署 API Worker：

```bash
pnpm --filter @tiji/api exec wrangler deploy
```

生产部署前需要确认 `apps/api/wrangler.toml` 中的 `database_id`、域名、CORS、密钥和环境配置均已替换为正式值。统一 Web 端应构建并部署到 Cloudflare Pages 或其他支持 Nuxt 的托管服务。

## 当前开发状态

当前版本已实现 API 核心闭环：注册/登录、题库创建、单选/判断题创建、活动创建与发布快照、公开开始答题、提交评分和结果汇总。前端目前是最小登录与公开活动入口，题库管理、完整答题 UI、错题本、收藏和答题记录页面将在后续迭代实现。
