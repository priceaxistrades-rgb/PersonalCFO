BEGIN;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recurring_rule_id integer REFERENCES recurring_rules(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS transactions_recurring_rule_date_unique ON transactions(recurring_rule_id, txn_date) WHERE recurring_rule_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS transactions_recurring_rule_idx ON transactions(recurring_rule_id);
COMMIT;
