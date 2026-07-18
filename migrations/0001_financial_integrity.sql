BEGIN;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS transfer_group_id varchar(64),
  ADD COLUMN IF NOT EXISTS reconciled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reconciled_at timestamp;

CREATE INDEX IF NOT EXISTS transactions_transfer_group_idx ON transactions(transfer_group_id);
CREATE INDEX IF NOT EXISTS transactions_user_reconciled_idx ON transactions(user_id, reconciled);

CREATE TABLE IF NOT EXISTS account_transfers (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_account_id integer NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  to_account_id integer NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  amount numeric(14,2) NOT NULL,
  transfer_date date NOT NULL,
  note text,
  transfer_group_id varchar(64) NOT NULL UNIQUE,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT account_transfers_distinct_accounts CHECK (from_account_id <> to_account_id),
  CONSTRAINT account_transfers_positive_amount CHECK (amount > 0)
);
CREATE INDEX IF NOT EXISTS account_transfers_user_date_idx ON account_transfers(user_id, transfer_date);

CREATE TABLE IF NOT EXISTS recurring_rules (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id integer REFERENCES accounts(id) ON DELETE SET NULL,
  transaction_type varchar(16) NOT NULL,
  category varchar(50) NOT NULL,
  amount numeric(14,2) NOT NULL,
  note text,
  frequency varchar(16) NOT NULL,
  interval_count integer NOT NULL DEFAULT 1,
  next_run_date date NOT NULL,
  end_date date,
  active boolean NOT NULL DEFAULT true,
  last_generated_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT recurring_rules_type_check CHECK (transaction_type IN ('income','expense')),
  CONSTRAINT recurring_rules_frequency_check CHECK (frequency IN ('weekly','monthly','quarterly','yearly')),
  CONSTRAINT recurring_rules_positive_amount CHECK (amount > 0),
  CONSTRAINT recurring_rules_interval_check CHECK (interval_count BETWEEN 1 AND 120),
  CONSTRAINT recurring_rules_date_check CHECK (end_date IS NULL OR end_date >= next_run_date)
);
CREATE INDEX IF NOT EXISTS recurring_rules_due_idx ON recurring_rules(active, next_run_date);
CREATE INDEX IF NOT EXISTS recurring_rules_user_idx ON recurring_rules(user_id);

COMMIT;
