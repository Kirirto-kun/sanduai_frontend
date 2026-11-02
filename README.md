# Sandu AI — frontend

Образовательная платформа на Next.js 16 и React 19. Правила веток, проверок и ручного релиза: [REPOSITORY-WORKFLOW.md](docs/REPOSITORY-WORKFLOW.md).

В `main` объединены пять модулей: Open Lesson, Training, Preschool Project Pro, Zerde Pro и Science Pro. Классический КМЖ сохранён отдельным планировщиком. На production из этих пяти модулей опубликованы Open Lesson, Preschool и Zerde; Training и Science находятся в исходном коде для последующего отдельного релиза.

Ветка `production` закрепляет фактически опубликованный frontend `2acb11d14cbd9eced5ca75aeca584023d05b5959`. Изменения `main` не развёртывают код на VPS. Подтверждённый выпуск описан в [отчёте Zerde](docs/DEPLOYMENT-ZERDE-2026-11-02.md) и его обезличенной ведомости доказательств.

## Локальный запуск

Нужны Node.js 24, npm и отдельно запущенный backend.

```bash
npm ci
```

Создайте локальный `.env.local`:

```dotenv
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
```

```bash
npm run dev
```

Интерфейс откроется на `http://localhost:3000`. Для production-сборки публичный API origin — `https://api.sanduai.kz`; параметры конфигурации и проверки находятся в `.github/workflows/ci.yml`. Локальные env, credentials и QA-артефакты в Git не добавляются.

## Проверки

```bash
npm audit --audit-level=high
npm run validate:api-base
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Если изолированный Windows checkout использует junction на зависимости вне корня проекта, для локальной проверки сборки используйте `npx next build --webpack`. Канонический image собирается отдельно со своими зависимостями; эта команда не меняет release-конфигурацию.

Перед изменениями прочитайте `AGENTS.md` и соответствующую документацию установленного Next.js в `node_modules/next/dist/docs/`. История, авторизация, платные операции и скачивания проверяются вместе с согласованным API-контрактом backend.
