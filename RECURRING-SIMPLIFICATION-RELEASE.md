# Recurring Transactions + Navigation Simplification v1

## Included
- Recurring income/expense schedules at `/recurring`
- Weekly, monthly, quarterly and yearly frequencies with intervals
- Account impact, next date, optional end date, pause/resume/delete
- Automatic due generation once per authenticated browser session/day plus manual generation
- Database uniqueness guard preventing duplicate rule/date transactions
- Atomic transaction creation, account balance update and schedule advancement
- Audit logs, ownership validation and rate limiting
- Primary navigation adds Recurring Transactions; intelligence is grouped under Advanced Insights without deleting routes

## Migration
Run `migrations/0002_recurring_transactions.sql` before deploying code. Rollback is `0002_recurring_transactions.rollback.sql` and should only be used after preserving generated records.

## Acceptance checks
1. Create a small recurring income due today against a test account.
2. Click Generate due now; one transaction and one balance update occur.
3. Click again; no duplicate is created for the same rule/date.
4. Confirm next date advances correctly.
5. Pause: generation does nothing. Resume: future due generation works.
6. Delete rule: existing generated transaction remains.
7. Test expense and verify balance decreases exactly once.
8. Verify Income/Expenses/Reports include generated entries normally.
9. Confirm Advanced Insights contains existing intelligence features and routes still work.

## Deployment
For this database-changing release use the existing staging branch/Preview, then Production backup, Production migration, and merge. Do not upload directly to main before migration.
