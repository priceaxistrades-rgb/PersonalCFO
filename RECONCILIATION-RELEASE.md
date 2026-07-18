# Reconciliation and Duplicate Detection v1

## Scope
- `/reconciliation` responsive review workspace
- Unreconciled, potential-duplicate, verified, and all views
- Exact-match duplicate detection using type, category, amount, date, account, and normalized note
- Manual verified/unverified status; nothing is deleted automatically
- User-isolated reconciliation mutation, rate limiting, and audit logging

## Database
No new Production migration is required if `0001_financial_integrity.sql` was applied for Account Transfers v1. It already added `transactions.reconciled` and `transactions.reconciled_at`.

## Direct deployment
This release may be uploaded to `main` because its required additive schema is already in Production. Vercel should retain the previous deployment if the build fails.

## Smoke tests
1. Open `/reconciliation`.
2. Confirm existing transactions appear under Needs review.
3. Mark one staging/test transaction verified.
4. Refresh and confirm it remains under Verified.
5. Mark it unverified and confirm reversal.
6. Confirm potential duplicates are warnings only and no transaction is deleted.
7. Confirm Income, Expenses, account balances, and Reports remain unchanged.

## Rollback
Roll back to the prior Vercel deployment. No database rollback is required; reconciliation columns are backward compatible.
