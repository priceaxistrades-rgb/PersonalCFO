BEGIN;
DROP TABLE IF EXISTS recurring_rules;
DROP TABLE IF EXISTS account_transfers;
DROP INDEX IF EXISTS transactions_user_reconciled_idx;
DROP INDEX IF EXISTS transactions_transfer_group_idx;
ALTER TABLE transactions
  DROP COLUMN IF EXISTS reconciled_at,
  DROP COLUMN IF EXISTS reconciled,
  DROP COLUMN IF EXISTS transfer_group_id;
COMMIT;
