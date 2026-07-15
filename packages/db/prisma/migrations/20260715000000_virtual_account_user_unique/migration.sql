-- Enforce one-to-one (1:1) virtual account per user.
-- Partial unique index ignores soft-deleted rows so a deleted account
-- does not block a future recreation, while guaranteeing at most one
-- ACTIVE virtual account per user at the database level.
CREATE UNIQUE INDEX IF NOT EXISTS virtual_accounts_user_id_unique
  ON virtual_accounts (user_id)
  WHERE deleted_at IS NULL;
