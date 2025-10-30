# Auth Stability Hardening Plan

This document captures the phased plan for eliminating the automatic logout problem. We will execute the phases in order of likelihood and impact, stopping only when the issue is definitively resolved.

Each phase is self‑contained and leaves observability breadcrumbs so we can verify the effect before moving forward.

---

## Phase 1 – Timeout & Retry Hardening *(highest priority)*

**Goal:** Prevent transient timeouts from clearing auth state.

- Update `raceWithTimeout` usage so a `TimeoutError` never clears `user`/`profile`.
- Add a bounded retry loop (2 attempts, exponential backoff) for `fetchUserData` and `checkUser` before treating the situation as failure.
- Keep the last known good `user`/`profile` values during retries; surface a warning toast instead of logging out.
- Only set `user`/`profile` to `null` when Supabase confirms there is no valid session (`getSession` returns null) or retries exhaust with non-timeout errors.

**Exit criteria:**
- Simulated timeouts (Slow 3G via DevTools) leave the user logged in after refresh.
- Logs show retry attempts and recovery without clearing auth state.

## Phase 2 – Session Fallback Pipeline

**Goal:** Ensure UI keeps minimal auth context even when profile fetch fails.

- When profile/user queries fail after retries, hydrate a minimal `user` object from `session.user` (id, email, metadata).
- Store a flag indicating profile data is stale and trigger a background fetch when connectivity stabilises.
- Notify the user (toast/banner) that full profile data is still loading, but retain access.

**Exit criteria:**
- Forced failures on the `profiles` table still show the dashboard with limited info, and the banner/toast appears.
- Once connectivity returns, profile data rehydrates automatically without manual refresh.

## Phase 3 – Supabase Client Safeguards

**Goal:** Eliminate ambiguity in session persistence and refresh behaviour.

- Restore explicit auth client options: `persistSession`, `autoRefreshToken`, `detectSessionInUrl`, `storage: localStorage`, and `flowType: 'pkce'`.
- Keep Supabase’s default storage key to avoid invalidating existing tokens.
- Guard client creation for SSR safety (check `typeof window !== 'undefined'`).
- Log (dev only) when client initialises without browser storage (e.g., private mode).

**Exit criteria:**
- Manual inspection confirms tokens persist across reloads; existing sessions are unaffected.
- No regressions observed compared with current baseline.

## Phase 4 – Zustand Store Persistence

**Goal:** Survive hard refreshes without depending solely on Supabase rehydration.

- Wrap `useAuthStore` with `persist` middleware using `localStorage` via `createJSONStorage`.
- Version store schema and provide migration hooks to avoid stale data.
- Ensure logout clears both in-memory state and persisted snapshot.

**Exit criteria:**
- Refreshing the page keeps the dashboard visible (state rehydrates before Supabase responds).
- Logging out removes persisted auth data immediately.

## Phase 5 – Token Refresh Guardrails & Observability

**Goal:** Catch edge cases that previously caused silent sign-outs.

- Handle Supabase auth events (`TOKEN_REFRESHED`, `SIGNED_OUT`, `REAUTHENTICATED`) explicitly.
- On JWT errors (e.g., `PGRST301`), attempt `refreshSession`; only sign out if refresh fails.
- Add structured debug logging (dev only) and toasts so we can trace refresh cycles.
- Optionally, add lightweight analytics hooks (or console grouping) to detect repeated failures.

**Exit criteria:**
- Simulated JWT expiry triggers refresh path without logging the user out.
- Logs/toasts provide clear signal of refresh attempts and outcomes.

## Phase 6 – Verification & Regression Safety Net

**Goal:** Prove the fix works under realistic conditions and prevent regressions.

- Add integration tests (Vitest + Supabase client mocks) covering: timeout recovery, fallback hydration, logout flow.
- Document manual test matrix (slow/fast network, idle tab resume, multi-tab usage).
- Update troubleshooting docs with new behaviours and recovery steps.

**Exit criteria:**
- Test suite passes locally and on CI.
- Manual checklist executed with screenshots/logs where relevant.
- Documentation reviewed and accepted.

---

We will execute phases sequentially. After each phase, we’ll evaluate whether the logout symptom is resolved; if not, we proceed to the next phase. This ensures we cover every identified moving part while keeping changes reviewable.

