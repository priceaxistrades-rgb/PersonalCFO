PersonalCFO authenticated-navigation repair

This ZIP contains only changed/new deliverables, not a full repository.

To commit through GitHub Desktop:
1. Open your existing PersonalCFO repository folder in GitHub Desktop.
2. Close GitHub Desktop temporarily if it has files open.
3. Extract this ZIP directly into the existing PersonalCFO repository root.
4. Allow the operating system to replace proxy.ts.
5. Reopen GitHub Desktop. It should show:
   - Modified: proxy.ts
   - New (optional): ARENA_REPAIR_AUDIT_2026-07-19.md
6. Review the proxy.ts diff, commit it, then push.

Essential code fix:
- proxy.ts must check the pcfo_session cookie, which is the cookie issued by src/lib/server-auth.ts.
- The route list corrects /debt and adds /budget, /health, and /onboarding.

If you only want the code repair, copy proxy.ts only. Do not copy the patch file into your app unless you want it retained as documentation.

Rollback before committing:
  git restore proxy.ts

Rollback after committing:
  git revert <commit-sha>
