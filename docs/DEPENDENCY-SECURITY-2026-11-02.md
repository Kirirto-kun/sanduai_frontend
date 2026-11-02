# Исправление зависимостей в main — 2 ноября 2026

Проверка объединённого frontend выявила в прежнем lockfile 5 high и 1 critical advisory. Изменение относится к интеграционной ветке и `main`; опубликованный frontend `2acb11d14cbd9eced5ca75aeca584023d05b5959` и его исторический отчёт не изменяются. Production-обновление требует отдельного ручного релиза.

Официальный [advisory Next.js GHSA-2464-fhr4-w9xw](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw) описывает RCE в Image Optimization на glibc Linux и указывает исправление в Next.js 16.4.1 либо sharp ≥0.35.5. Выбран опубликованный [Next.js 16.4.4](https://github.com/vercel/next.js/releases/tag/v16.4.4), в той же major-ветке, с согласованной ESLint-конфигурацией.

| Зависимость | Было | Закреплено |
| --- | --- | --- |
| `next` / `eslint-config-next` | 16.3.5 | 16.4.4 |
| `sharp`, override | 0.35.4 | 0.35.5 |
| `vitest` | ^4.1.11 | 4.1.12 |
| `vite`, lockfile | 8.2.2 | 8.3.5 |
| `brace-expansion`, lockfile | уязвимая 1.x | 1.1.21 |
| `source-map-js`, lockfile | 1.2.1 | 1.2.2 |
| `zod`, lockfile | уязвимая версия | 4.6.7 |

React и React DOM остаются 19.2.0. Нет принудительного major-обновления, понижения ESLint или обхода peer dependencies. Lockfile обновлён штатным разрешением зависимостей и совместимыми исправлениями, без `npm audit fix --force`.

После обновления `npm audit --audit-level=high` показывает **0 high / 0 critical**. Остались 2 low и 16 moderate записей, включая KaTeX и цепочку minimatch/ESLint; они не объявляются устранёнными. Предлагаемые audit major-замены не применены автоматически.

Установка и проверки выполняются с отдельными зависимостями изолированного checkout. Исходная рабочая папка и её `node_modules` не меняются. Перед merge проверяются точный lockfile через `npm ci`, весь frontend test suite, ESLint, TypeScript, API-base validation, production build и канонический Docker build. Итоговые результаты относятся к SHA объединённой ветки, а не к прежнему production-образу.
