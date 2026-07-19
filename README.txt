FINAL MUTUAL FUND SEARCH FIX

Copy src/app/markets/AddWatch.tsx over the same file in your existing GitHub Desktop PersonalCFO repository. This is a single-file replacement.

This version calls the verified live /api/market/search endpoint directly on every input change (and retains a debounced retry). It also shows the actual API error rather than incorrectly saying no fund was found.

Before commit, GitHub Desktop MUST show exactly:
Modified: src/app/markets/AddWatch.tsx

After Vercel says Ready, hard refresh /markets (Ctrl+Shift+R). Search PARAG.
Expected: names and Track buttons. If an error occurs, send the visible red "Fund search error" text.

Validated: TypeScript passed; Jest 91/91 passed; production build passed.
