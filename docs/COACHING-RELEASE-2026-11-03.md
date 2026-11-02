# Coaching Pro — isolated frontend release candidate

This candidate starts from the actual live Science Pro frontend
`8cb2a84bd09d8f0bd9456d6bce86ea66f517b44c`, not the older Zerde release or
`main`. It is prepared on `codex/coaching-release-20261103`; it has not been
merged or deployed by this preparation step.

Only the Coaching delta from feature baseline
`063302d89005536d74b2942a642b220037865a89` through
`8a07370540e587d6fbcc73aa66bee1d716c254ed` is transplanted. The five shared
conflicts were resolved against the live files: navigation, retained history,
history page, authenticated DOCX download and chat-widget visibility. Science
navigation/history/material cards, authentication, API client and existing
module behavior are preserved. The two existing Coaching sticky-position fixes
change horizontal overflow containment to `clip` in the body/dashboard wrapper.

Training is excluded: no Training route, module, navigation, history filter or
download case is introduced. Package manifests/lockfile, patched Next16.4.4,
React19.2.0, ESLint configuration, Dockerfile, Compose and CI remain byte-equal
to live8cb. No dependency upgrade or deployment configuration change is included.
Coaching's inherited Training icon re-export is replaced with the identical
five SVG primitives locally; its fallback uses the already-live shared
competition icon component. No Training runtime dependency remains.

The release uses the existing manual immutable Docker path for `sanduai.kz`,
with `NEXT_PUBLIC_API_BASE=https://api.sanduai.kz`. Vercel's separate
account-blocked GitHub status is not the VPS production release mechanism.
The operator must retain the actual live8cb frontend image for rollback;
no old database restore or backend downgrade is part of this frontend candidate.

Validation on this isolated candidate:

- Fresh `npm ci --ignore-scripts` with the unchanged lockfile succeeded.
- All **710 tests / 110 files** passed, including Science and Coaching, plus
  the release guard for retained Science navigation and excluded Training.
- TypeScript passed. Full ESLint passed with **0 errors / 74 warnings** under
  the unchanged live compatibility configuration; the localized icon and release
  guard also passed targeted lint.
- `npm audit --audit-level=high` and production API-base validation passed.
  The unchanged dependencies report 2 low and 16 moderate advisories; no
  dependency update is included in this feature release.
- Default `next build` (Turbopack, not a junction workaround) succeeded with
  `NEXT_PUBLIC_API_BASE=https://api.sanduai.kz`: **77 routes**, including
  Coaching and Science Pro and excluding Training.
- Protected live framework/lockfile, Docker/Compose/CI, Science source and
  material card, builder preview, shared API/auth files have an empty Git diff
  against 8cb. There are no unresolved merge entries.

The frontend image build, closed production acceptance and ingress cutover
remain separate operator steps. These local checks do not claim deployment.
