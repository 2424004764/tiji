PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  locale TEXT NOT NULL DEFAULT 'zh-CN',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  last_seen_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX sessions_user_idx ON sessions(user_id, expires_at);

CREATE TABLE question_banks (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','public')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX banks_owner_idx ON question_banks(owner_id, status, updated_at);

CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('single_choice','true_false','multiple_choice','short_answer')),
  stem TEXT NOT NULL,
  options_json TEXT NOT NULL DEFAULT '[]',
  answer_json TEXT NOT NULL,
  explanation TEXT NOT NULL DEFAULT '',
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  tags_json TEXT NOT NULL DEFAULT '[]',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX questions_owner_idx ON questions(owner_id, updated_at);

CREATE TABLE bank_questions (
  bank_id TEXT NOT NULL REFERENCES question_banks(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (bank_id, question_id)
);
CREATE INDEX bank_questions_order_idx ON bank_questions(bank_id, position);

CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  bank_id TEXT NOT NULL REFERENCES question_banks(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  share_token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','paused','ended')),
  settings_json TEXT NOT NULL DEFAULT '{}',
  snapshot_version INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT,
  ends_at TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX activities_owner_idx ON activities(owner_id, status, updated_at);

CREATE TABLE activity_questions (
  activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  type TEXT NOT NULL,
  stem TEXT NOT NULL,
  options_json TEXT NOT NULL,
  answer_json TEXT NOT NULL,
  explanation TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (activity_id, question_id)
);
CREATE INDEX activity_questions_order_idx ON activity_questions(activity_id, position);

CREATE TABLE respondents (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  anonymous_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(activity_id, anonymous_key)
);

CREATE TABLE attempts (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  respondent_id TEXT NOT NULL REFERENCES respondents(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted','expired')),
  idempotency_key TEXT NOT NULL,
  score INTEGER,
  total_points INTEGER,
  duration_seconds INTEGER,
  started_at TEXT NOT NULL,
  submitted_at TEXT,
  UNIQUE(activity_id, idempotency_key)
);
CREATE INDEX attempts_activity_idx ON attempts(activity_id, status, submitted_at);

CREATE TABLE attempt_answers (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  answer_json TEXT NOT NULL,
  is_correct INTEGER,
  points INTEGER,
  answered_at TEXT NOT NULL,
  UNIQUE(attempt_id, question_id)
);

CREATE TABLE mistakes (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  first_missed_at TEXT NOT NULL,
  last_missed_at TEXT NOT NULL,
  miss_count INTEGER NOT NULL DEFAULT 1,
  resolved_at TEXT,
  PRIMARY KEY(user_id, question_id)
);
CREATE INDEX mistakes_user_idx ON mistakes(user_id, last_missed_at);

CREATE TABLE favorites (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY(user_id, question_id)
);

CREATE TABLE study_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('correct','incorrect','skipped')),
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX study_records_user_idx ON study_records(user_id, created_at);
