PersonalCFO repair + Safe Bank Statement Import

This archive contains ONLY files modified since the GitHub repository clone.
Extract its CONTENTS directly into your existing PersonalCFO GitHub Desktop repository folder and allow files to be replaced.

Files to copy:
- proxy.ts
  Fixes the post-login redirect loop by checking the actual pcfo_session cookie.
- src/app/api/upload/excel/route.ts
  Adds bank-statement detection (Debit/Credit/Withdrawal/Deposit/Narration/Particulars), automatic income/expense classification, privacy exclusion of identifier columns, and safer bank-import audit metadata.
- src/components/FileUploader.tsx
  Adds the Safe bank statement import option and clear privacy information.

Privacy behavior:
- Transaction ID, transaction reference, UTR, RRN, cheque number, and bank reference columns are deliberately ignored. They are not saved into transactions or audit details.
- The original upload is parsed in memory by PersonalCFO and is not written to disk/database by this route.
- Data still travels over HTTPS to YOUR PersonalCFO server in order to save selected financial entries to your PersonalCFO PostgreSQL database. It is not sent to banks, AI services, analytics services, or other third parties by these changes.

GitHub Desktop process:
1. Make a backup or create a branch in GitHub Desktop.
2. Extract into your existing PersonalCFO repository root.
3. GitHub Desktop should show the 3 modified files.
4. Review, commit and push. Suggested message:
   fix: repair session redirect and add private bank statement import
5. Wait for Vercel/GitHub deployment, then test in an incognito browser.

Validated locally:
- npm run lint (7 existing warnings, zero errors)
- npm test -- --runInBand (9 suites / 91 tests passed)
- npm run build (passed)
