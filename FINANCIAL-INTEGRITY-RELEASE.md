# Financial Integrity Release — Account Transfers v1

## Status
Production candidate. Apply and test on Neon staging before Production.

## Scope
- Atomic account-to-account transfers
- Transfer history
- Exact source/destination balance updates
- Transfers excluded from income and expense tables and calculations
- Account ownership checks, insufficient-funds protection, validation, rate limiting and audit logging
- Responsive desktop/mobile UI at `/transfers`

## Files
- `migrations/0001_financial_integrity.sql`
- `migrations/0001_financial_integrity.rollback.sql`
- `src/app/api/transfers/route.ts`
- `src/app/transfers/page.tsx`
- `src/app/transfers/TransfersClient.tsx`
- Schema/navigation/style changes

## Staging migration
1. In Neon select `staging-financial-integrity` — never Production.
2. Open SQL Editor and confirm the selected branch in the header.
3. Paste and run `migrations/0001_financial_integrity.sql`.
4. Upload this release to GitHub branch `staging-financial-integrity`.
5. Wait for Vercel Preview to become Ready.

## Acceptance tests
1. Existing accounts and transactions still load.
2. Open `/transfers`; two or more accounts are listed.
3. Transfer ₹100 between two staging accounts.
4. Source decreases exactly ₹100; destination increases exactly ₹100.
5. Transfer appears once in history.
6. Income and expense totals do not change.
7. Same-account transfer is rejected.
8. Zero, negative and excessive transfers are rejected.
9. A user cannot transfer from/to another user's account.
10. Mobile and desktop forms are usable.
11. Refresh retains balances and history.

## Production promotion
1. Create a Neon backup branch from Production named `backup-before-transfers-v1`.
2. Run the same forward migration on Neon Production.
3. Merge the verified GitHub pull request into `main`.
4. Wait for Vercel Production to become Ready.
5. Run one small transfer using a dedicated test account and repeat the acceptance checks.

## Rollback
Prefer rolling back the Vercel deployment first. The SQL rollback drops transfer data and reconciliation/recurrence foundation fields, so export transfer records before running it. Run `0001_financial_integrity.rollback.sql` only after confirming no required Production transfer data will be lost.

## AI documentation rule
Any future AI/model/provider/formula change must update `PersonalCFO-AI-Context.md`, tests, privacy assumptions and environment-variable documentation before merge.
