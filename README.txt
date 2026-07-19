Market discovery and quote-status update

Replace the included files in your existing PersonalCFO repository, then commit/push.

Included:
- Mutual fund name search, result rows and Track actions (AMFI/MFAPI).
- Direct search plus debounced retry and visible real API errors.
- Crypto/commodity/REIT/bond symbol resolution to valid live tickers.
- Markets status line showing source and last update time.
- Preserves existing last/manual values when a provider refresh is unavailable.

No API key is required. Test: search PARAG, then track 122639; test BTC-USD and GOLDBEES.NS.
Validated: TypeScript passed, Jest 91/91 passed, production build passed.
