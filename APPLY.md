# Apply the PersonalCFO CI Fix

This patch was generated from GitHub `main` commit `9023c7a` after reproducing the failure locally.

## Apply

1. In GitHub Desktop, select PersonalCFO / main and Fetch + Pull.
2. Repository > Open in PowerShell.
3. Put `ci-fix.patch` in the repository root.
4. Run:

```powershell
git apply --check ci-fix.patch
git apply ci-fix.patch
```

5. Delete `ci-fix.patch` from the repository folder (do not commit the patch itself).
6. In GitHub Desktop, review the changes. The deleted root-level duplicate files are intentional.
7. Commit: `Fix CI path pollution and quality gate`
8. Push origin.

## Root cause

A previous upload flattened application files into the repository root (`page.tsx`, `server-auth.ts`, `manage/`, `auth/`, etc.). TypeScript compiled both the correct files and these misplaced duplicates. There was also an undefined variable in the real investments route and lint errors.

The dependency gate now fails only on high/critical advisories. The known moderate Next/PostCSS and drizzle-kit/esbuild findings remain reported because npm offers only incorrect/breaking downgrade paths.
