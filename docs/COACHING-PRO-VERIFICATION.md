# Coaching Pro verification

Date: 3 November 2026. Feature branch: `codex/coaching-pro`. No production deployment.

## Automated frontend checks

- Full Vitest suite: 115 files, 755 tests passed.
- TypeScript: `npx tsc --noEmit` passed.
- ESLint: zero errors; 74 existing repository warnings remain.
- Clean dependency installation: `npm ci --no-fund --ignore-scripts` passed with the unchanged lockfile.
- Dependency audit at the required high threshold passed: no high/critical findings; npm reports 2 low and 16 moderate advisories in existing dependencies.
- API base validation passed. Production build with `NEXT_PUBLIC_API_BASE=https://api.sanduai.kz` passed, including the new coaching route. The local development process uses `http://127.0.0.1:8000`.

## Browser checks

Verified authenticated local navigation, RU/KK form labels, topic presets, advanced details, explicit parameter confirmation, draft saving, native invalid-group-count validation, and recovery after restarting the development server. The actual queued jobs render progress and cancellation controls without browser errors.

An actual completed Russian online coaching with AI was opened from the user history and general coaching filter. All nine sections render in order, keyboard Enter opens practical tasks, copying returns the complete 30,832-character document, and the Word button downloads a real DOCX. The API rejects another user's access with 404. A zero-balance account cannot submit; its recovery link opens the existing profile. Switching back restores the owner's draft.

The completed screen was inspected at desktop width and 375 px mobile width. Page width equals viewport width; only the timeline and mobile contents strip scroll horizontally. Content, speeches and examples wrap without clipping.

Browser QA found that horizontal overflow containers prevented sticky positioning. Body/dashboard clipping and the result card now use `clip`, preserving horizontal containment while keeping the header and desktop contents at their intended scroll position. A direct browser measurement confirms contents top = 100 px after navigating to the timeline. Long generated titles also wrap safely. The final production build and full 755-test suite passed after these changes.

## Data and external services

QA uses a separate local PostgreSQL database and local test accounts. Credentials, provider payloads, screenshots and exports stay in ignored task directories. Initial provider requests failed due to exhausted provider balances and reserved tokens were refunded. After the user topped up DeepSeek, actual generation and timing-repair verification resumed. No fixture was installed as an application generation fallback.
