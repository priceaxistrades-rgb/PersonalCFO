BEGIN;
DROP INDEX IF EXISTS transactions_recurring_rule_idx;
DROP INDEX IF EXISTS transactions_recurring_rule_date_unique;
ALTER TABLE transactions DROP COLUMN IF EXISTS recurring_rule_id;
COMMIT;
