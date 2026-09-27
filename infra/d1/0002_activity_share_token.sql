ALTER TABLE activities ADD COLUMN share_token TEXT;
CREATE INDEX activities_share_token_idx ON activities(share_token);
