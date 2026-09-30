-- OAuth 账号映射：本站用户与工具站（OAuth2 授权服务器）用户的绑定关系，
-- 以 provider_user_id（userinfo 的 sub）为准建立本地账号映射。
-- 令牌列仅用于登出时向提供方撤销授权，本站会话仍走 sessions 表。
CREATE TABLE oauth_accounts (
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_json TEXT NOT NULL DEFAULT '{}',
  access_token TEXT,
  refresh_token TEXT,
  access_token_expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (provider, provider_user_id)
);
CREATE INDEX oauth_accounts_user_idx ON oauth_accounts(user_id);
