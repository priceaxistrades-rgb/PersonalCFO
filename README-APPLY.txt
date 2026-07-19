PersonalCFO consolidated update — apply to existing GitHub Desktop clone

1. Download and extract this ZIP.
2. Open the personal-cfo-release folder.
3. Copy its CONTENTS into the root of your existing PersonalCFO clone (the folder GitHub Desktop uses). Allow replacement of matching files.
4. In GitHub Desktop, review changed files, commit, and push.

Production Vercel variables (Settings > Environment Variables > Production):
ALLOWED_ORIGINS=https://personal-cfo-snjo.vercel.app
APP_ORIGIN=https://personal-cfo-snjo.vercel.app
HEALTHCHECK_SECRET=<run: openssl rand -base64 32>
Never commit real secrets.

Included functional changes:
- Fix login redirect proxy cookie mismatch.
- First-party origin checks and response security headers.
- Public health response is minimal; detailed diagnostics need a bearer secret.
- Safe bank CSV/XLSX import ignores transaction IDs/UTR/RRN/cheque/reference columns and recognises bank debit/credit/narration formats.
- Quick Entry investment purchase requires a debit account, verifies account ownership and funds, debits it atomically, and creates an Investment Purchase expense ledger record.
- Investment top-ups also debit only the added amount atomically.
- Investment sale validates and credits the selected receiving account atomically.
- Live portfolio poller requests crypto, commodities, indices, REITs and bond ETFs in addition to stocks/MFs.

Deployment smoke test:
1. Use a test account with a ₹10,000 bank balance.
2. Add a ₹1,000 investment via Quick Entry. Confirm the bank is ₹9,000, investment is ₹1,000, and net worth has not risen merely because of the purchase.
3. Add more units for ₹500. Confirm bank falls only by ₹500.
4. Sell an investment and confirm receiving account balance increases by proceeds.
5. Test BTC-USD and GOLDBEES.NS holdings, and an MF with a valid scheme code.

Validation run locally: TypeScript passed; Jest 91/91 tests passed; production build passed. ESLint has 7 existing image/font warnings, no errors.
