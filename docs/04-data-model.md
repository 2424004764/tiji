# 数据模型

数据库：Cloudflare D1（SQLite）。所有时间使用 UTC ISO 8601；主键使用 UUID；业务删除采用软删除。

## 表

- `users(id, username UNIQUE, password_hash, status, locale, timezone, created_at, updated_at)`
- `sessions(id, user_id, token_hash UNIQUE, expires_at, revoked_at, last_seen_at, created_at)`
- `oauth_accounts(provider, provider_user_id, user_id, profile_json, access_token, refresh_token, access_token_expires_at, created_at, updated_at, PRIMARY KEY(provider, provider_user_id))`
- `question_banks(id, owner_id, name, description, visibility, status, created_at, updated_at, deleted_at)`
- `questions(id, owner_id, type, stem, options_json, answer_json, explanation, difficulty, tags_json, version, created_at, updated_at, deleted_at)`
- `bank_questions(bank_id, question_id, position, created_at, PRIMARY KEY(bank_id, question_id))`
- `activities(id, owner_id, bank_id, title, description, share_token_hash UNIQUE, status, settings_json, snapshot_version, starts_at, ends_at, published_at, created_at, updated_at)`
- `activity_questions(activity_id, question_id, position, type, stem, options_json, answer_json, explanation, points, PRIMARY KEY(activity_id, question_id))`
- `respondents(id, activity_id, display_name, anonymous_key, created_at, UNIQUE(activity_id, anonymous_key))`
- `attempts(id, activity_id, respondent_id, status, idempotency_key, score, total_points, duration_seconds, started_at, submitted_at, UNIQUE(activity_id, idempotency_key))`
- `attempt_answers(id, attempt_id, question_id, answer_json, is_correct, points, answered_at, UNIQUE(attempt_id, question_id))`
- `mistakes(user_id, question_id, first_missed_at, last_missed_at, miss_count, resolved_at, PRIMARY KEY(user_id, question_id))`
- `favorites(user_id, question_id, created_at, PRIMARY KEY(user_id, question_id))`
- `study_records(id, user_id, question_id, source, result, duration_seconds, created_at)`

## 约束与索引

为 `owner_id/status`、`activity_id/submitted_at`、`user_id/last_missed_at`、`user_id/created_at` 建组合索引。公开查询只读取 `activity_questions` 的 `stem/options/points`，答案和解析仅在 Worker 评分或授权结果接口内部使用。

## 快照

发布活动时在事务中复制题库题目的当前版本到 `activity_questions`。原题目更新只影响未来活动；活动结束后快照保留以支持历史评分复核。未来如需编辑已发布活动，创建新活动版本而非原地覆盖。

## 迁移约定

迁移文件按 `0001_name.sql` 递增，只追加不改写已执行迁移。生产执行前在 preview D1 验证；破坏性变更拆成兼容的多阶段迁移。
