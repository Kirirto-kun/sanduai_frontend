# Coaching Pro verification

Date: 3 November 2026. Feature branch: `codex/coaching-pro`. No production deployment.

## Automated frontend checks

- Full Vitest suite: 114 files, 753 tests passed.
- TypeScript: `npx tsc --noEmit` passed.
- ESLint: zero errors; 74 existing repository warnings remain.
- Clean dependency installation: `npm ci --no-fund --ignore-scripts` passed with the unchanged lockfile.
- Dependency audit at the required high threshold passed: no high/critical findings; npm reports 2 low and 16 moderate advisories in existing dependencies.
- API base validation passed. Production build with `NEXT_PUBLIC_API_BASE=https://api.sanduai.kz` passed, including the new coaching route. The local development process uses `http://127.0.0.1:8000`.

## Browser checks

Verified authenticated local navigation, RU/KK form labels, topic presets, advanced details, explicit parameter confirmation, draft saving, native invalid-group-count validation, and recovery after restarting the development server. The actual queued jobs render progress and cancellation controls without browser errors.

Final checks of completed AI results, mobile layout, copying, history reopening and Word downloads are in progress. Their evidence will be added before handoff.

## Data and external services

QA uses a separate local PostgreSQL database and local test accounts. Credentials, provider payloads, screenshots and exports stay in ignored task directories. Initial provider requests failed due to exhausted provider balances and reserved tokens were refunded. After the user topped up DeepSeek, actual generation and timing-repair verification resumed. No fixture was installed as an application generation fallback.
