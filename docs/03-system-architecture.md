# 系统架构

## 拓扑

```text
Browser / mobile browser / future clients
        |
        +--> Nuxt 3 unified web ------> Cloudflare Worker (Hono)
                                      |-- D1 主数据
                                      |-- KV 短缓存/配置
                                      |-- R2（后续附件）
```

## 应用边界

- `apps/api`：路由、鉴权、中间件、领域服务、D1 repository、schema 校验。
- `apps/web`：Nuxt 3 统一 Web 应用，负责 SEO 公开页、登录、工作台和答题交互。
- `packages/shared`：API DTO、Zod schema、枚举、分页和错误码。
- `packages/i18n`：语言包、语言检测与格式化约定。
- `infra/d1`：迁移、种子和本地数据说明。

## API 约定

API 前缀为 `/api/v1`，统一返回 `{ data, error, meta }`。认证采用 HttpOnly session cookie，并支持工具站 OAuth2 授权码登录（本站作为客户端，`state` 校验与 `client_secret` 只存 Worker 侧，以提供方 `sub` 映射本地账号）。公开活动使用高熵 token；服务端按活动状态过滤字段。所有写请求校验 JSON schema，列表接口使用 cursor 分页。

## Cloudflare 环境

`dev` 使用本地 D1；`preview` 使用独立 D1 数据库；`production` 使用正式 D1。环境变量只保存公开配置和密钥引用，敏感值通过 Wrangler secret 注入。KV 不承担强一致业务数据。

## SEO 架构决策

当前 Web 端统一使用 Nuxt SSR/预渲染公开可索引页面和复杂交互页面。后续若明确需要小程序或原生 App，再单独新增 uni-app 客户端；它将复用 API、DTO 和 i18n 资源。公开答题页默认 `noindex`，避免把一次性活动和用户输入内容作为搜索结果；题库详情在获得明确公开授权后才允许索引。

## 一致性与可用性

活动发布在一个事务中生成题目快照和活动状态。提交答卷使用唯一 `(activity_id, idempotency_key)`，评分在 Worker 内完成并写入 D1。读多写少的公开活动元数据可短缓存，但答题开始、提交和结果查询不得依赖过期缓存。
