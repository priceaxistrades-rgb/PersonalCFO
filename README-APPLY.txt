PersonalCFO combined repair, security, safe-bank-import, and investment-integrity update

1. Extract the CONTENTS into the root of your existing GitHub Desktop PersonalCFO repository.
2. Allow files to be replaced, then review the changes in GitHub Desktop.
3. Add Vercel Production environment variables:
   ALLOWED_ORIGINS=https://personal-cfo-snjo.vercel.app
   APP_ORIGIN=https://personal-cfo-snjo.vercel.app
   HEALTHCHECK_SECRET=<openssl rand -base64 32>
4. Commit and push.

Important investment changes:
- Quick Entry investment purchases now require a Debit / Funding Account.
- The server atomically creates the holding, reduces the selected account balance,
  and creates an Investment Purchase expense transaction. This prevents cash and
  investment value from being double-counted in net worth.
- A purchase is rejected when the account does not belong to the user or has
  insufficient balance.
- Existing manually entered/imported investments continue to be supported.

Market changes:
- Investment dashboard live polling now requests crypto, commodities, indices,
  REITs and bonds in addition to stocks and mutual funds.
- A crypto holding should use e.g. BTC-USD / ETH-USD. Commodity examples:
  GOLDBEES.NS, SILVERBEES.NS, GC=F, SI=F.
- A mutual fund requires a valid scheme code from its search selection.

Validated locally: TypeScript passed; 91/91 tests passed; production build passed.
