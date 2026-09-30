# API 规范

Base URL：`/api/v1`。成功响应：`{ "data": ..., "error": null, "meta": {} }`；失败响应：`{ "data": null, "error": { "code": "...", "message": "..." }, "meta": {} }`。

## 认证

- `POST /auth/register`：`{ username, password }` -> 用户摘要并建立 session。
- `POST /auth/login`：登录并建立 session。
- `POST /auth/logout`：撤销当前 session；若用户绑定过工具箱账号，顺带向工具站撤销其 OAuth 令牌（尽力而为）。
- `GET /auth/me`：返回当前用户。
- `PATCH /auth/password`：修改密码并撤销其他 session。

### 工具站 OAuth2 登录（授权码模式）

工具站（工具箱）作为授权服务器，本站作为客户端。配置 `OAUTH_CLIENT_ID` / `OAUTH_CLIENT_SECRET`（Worker secret）后启用；回调地址 `<API 域名>/api/v1/auth/oauth/callback` 需加入工具站应用白名单。

- `GET /auth/oauth/status`：返回 `{ enabled }`，前端据此显示/隐藏「使用工具箱账号登录」。
- `GET /auth/oauth/start?redirect=/banks`：生成防 CSRF 的 `state` 存入短效 HttpOnly Cookie，302 跳转工具站授权页。
- `GET /auth/oauth/callback`：校验 `state` -> 授权码换令牌 -> 拉取 userinfo -> 以 `sub` 查 `oauth_accounts` 映射本地账号（首次自动注册，无密码）-> 建立本站 session -> 302 回 Web 端。用户拒绝或任一步失败时回登录页并带 `oauth_error` 参数（`access_denied` / `invalid_state` / `token_exchange` / `userinfo_failed` / `account_disabled` / `not_configured` / `failed`）。

## 题库与题目

- `GET/POST /banks`
- `GET/PATCH/DELETE /banks/:bankId`
- `POST /banks/:bankId/questions`
- `GET/PATCH/DELETE /banks/:bankId/questions/:questionId`
- `POST /banks/:bankId/reorder`

题目请求包含 `type`、`stem`、`options`、`answer`、`explanation`、`difficulty`、`tags`。MVP `type` 为 `single_choice` 或 `true_false`。

## 活动与答题

- `POST /activities`：创建草稿。
- `POST /activities/:id/publish`：校验题库并生成快照。
- `POST /activities/:id/pause`、`POST /activities/:id/end`。
- `GET /activities/:id/share`：仅拥有者，返回分享 URL。
- `GET /public/activities/:token`：返回公开活动元数据和题面。
- `POST /public/activities/:token/start`：`{ displayName }` -> respondent/attempt 临时标识。
- `POST /public/activities/:token/submit`：提交答案和 `Idempotency-Key`，返回自己的结果。

## 结果与学习

- `GET /activities/:id/results/summary`
- `GET /activities/:id/results/respondents?cursor=`
- `GET /activities/:id/results/respondents/:respondentId`
- `GET /me/mistakes`、`DELETE /me/mistakes/:questionId`
- `GET /me/favorites`、`PUT /me/favorites/:questionId`、`DELETE /me/favorites/:questionId`
- `GET /me/records`

## 错误码

`AUTH_REQUIRED`、`INVALID_CREDENTIALS`、`USERNAME_TAKEN`、`VALIDATION_ERROR`、`NOT_FOUND`、`FORBIDDEN`、`ACTIVITY_NOT_OPEN`、`DUPLICATE_SUBMISSION`、`RATE_LIMITED`、`INTERNAL_ERROR`。

## 权限

公开：活动元数据、未评分题面、开始答题、提交答卷。登录用户：自己的题库、活动和学习数据。活动拥有者：该活动汇总及答题者详情。任何响应不得包含未授权的答案、解析、session 或内部 token。
