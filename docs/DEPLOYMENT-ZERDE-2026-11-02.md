# Zerde Pro — production-релиз 2 ноября 2026

**Релиз опубликован:** backend `2226c33265e8488c4392062cd95b900c2608352d`, frontend `2acb11d14cbd9eced5ca75aeca584023d05b5959`, схема `20261030_zerde_usage`. Production API/UI, финансовая приёмка, очистка QA и внешний HTTPS smoke — **PASS**. Общий ingress открыт **2 ноября 2026, 13:10:29 UTC / 21:10 Asia/Shanghai**, после всех gates и обновления release pointer.

Релиз добавляет Zerde Pro: 14 методических режимов на RU/KK, приватные проекты и реальные загрузки, бесплатную проверку правил, необязательную ИИ-консультацию за 10 монет, журнал фактической помощи и восемь редактируемых шаблонов DOCX/PDF. Финальное поведение 2226 сохраняет точный исторический запрос после правки текущего проекта; результаты не подменяют исследование ученика готовой работой.

Пользователь разрешил production-развёртывание и проверку после него. Production-действия выполнил основной оператор; независимые агенты проверили код, документы и артефакты. До завершения закрытой приёмки ingress оставался в maintenance. Прежние документы о локальной поставке от 30 октября отражают только тот этап.

Основание и история в локальном архиве оператора: `PRODUCTION-RELEASE-RUNBOOK.md`, предыдущий подтверждённый релиз `DEPLOYMENT-PRESCHOOL-2026-10-29.md` и более ранний `DEPLOYMENT-KMZH-CLASSIC-2026-10-29.md`. Последний не является исходной live-базой этого релиза. Незавершённый Training-релиз не публиковался. Публикуемые обезличенные [проверки релиза](DEPLOYMENT-ZERDE-2026-11-02.evidence.json) содержат итоговые результаты и хеши приватных доказательств без credentials или клиентских данных.

## Версии и границы

| Параметр | Состояние |
| --- | --- |
| Подтверждённый исходный backend | `82da419325a7c799a28af3f64c452cda5721ae2e` |
| Подтверждённый исходный frontend | `b358c8ec2514a7db8e8cac978747adcb8bea3a63` |
| Опубликованный backend, GitHub | `2226c33265e8488c4392062cd95b900c2608352d` |
| Промежуточный backend до forward-fix | `f810b91fc215532c5ab8175c3b0a128ccddbe868`; до повторного freeze все 8 сервисов healthy, ingress не открывался |
| Опубликованный frontend, GitHub | `2acb11d14cbd9eced5ca75aeca584023d05b5959` |
| Immutable images | `sanduai-backend:2226c33265e8488c4392062cd95b900c2608352d`, `sanduai-frontend:2acb11d14cbd9eced5ca75aeca584023d05b5959`; `linux/amd64`, собраны вне production |
| Transport | Полные приватные архивы; финальный 2226 доставлен и загружен, stage PASS. Размеры и SHA256 ниже |
| Исходная → текущая production-схема | `20261019_video_studio` → `20261030_zerde` → `20261030_zerde_usage`, native restore rehearsal и production-миграция PASS |
| Схема forward-fix | `20261030_zerde_usage` → `20261030_zerde_usage`; дополнительный DDL не требуется |
| Production URL | [Zerde Pro](https://sanduai.kz/dashboard/ai/zerde), [каталог API](https://api.sanduai.kz/api/v1/zerde/catalog), [readiness](https://api.sanduai.kz/health/ready); внешний HTTPS smoke — **PASS** |
| Release stages | Исходный `/opt/sanduai/releases/zerde-20261102`; новая extension `/opt/sanduai/releases/zerde-20261102/forwardfix-2226c332`. Исходный seal сохраняется |

Состав: согласованный Zerde Pro и общие точки регистрации/навигации/истории поверх точных live-ревизий. Исходный `REVIEWED-SCOPE.json` F810 закрепляет 28 backend-файлов и 21 frontend-файл с хешами; отдельный manifest 2226 фиксирует пять последующих изменений относительно F810. Незавершённый Training и посторонние рабочие изменения не переносились. Два curriculum JSON сохраняют исходные опубликованные CRLF-байты и прежние checksum; декодированное содержимое и Classic КМЖ не менялись.

Закрытая production-приёмка обнаружила реальный дефект F810: общий worker штатно очищал `job.payload` после сохранения результата, поэтому история завершённой консультации возвращала 409. В 2226 изменены только три Zerde-файла и два теста: точный request snapshot сохраняется в приватном JSON журнала помощи до очистки payload; публичные usage/экспорты его исключают. История сохраняет owner/TTL-проверки и сверяет canonical SHA исходного запроса. Для старого задания текущий проект допустим лишь при точном совпадении этого SHA; отредактированный проект не выдаётся за исторический. Приватный snapshot наследует срок хранения журнала помощи, доступ через history endpoint остаётся ограничен TTL задания.

## Проверенный замороженный пакет

| Проверка вне production | Результат |
| --- | --- |
| Backend F810, полный baseline | **445 passed, 1 skipped**; полный `ruff check src tests scripts` пройден |
| Финальный backend 2226 | **95 focused tests passed на Linux и 95 на Windows**, Ruff и независимый review PASS; проверен настоящий enqueue → worker terminal scrub → history после изменения проекта |
| Frontend exact release | **647 tests passed**; production build и проверки TypeScript/ESLint пройдены |
| Источник → image | Все 717 tracked Git blobs совпали с checkout, 567 runtime-файлов image совпали с Git побайтно; канонический Dockerfile SHA256 `eb31d3fe89998eb21205f52553bf83c7e6074f46bf2da81734cfcffcaf017b81` |
| Word/PDF F810 | **32 экспорта, 40 страниц**: 8 шаблонов × RU/KK × DOCX/PDF; все страницы визуально проверены, реальные Times New Roman и казахские glyphs, acceptance validators PASS. В 2226 renderer/шрифты не изменены |
| Параллельные PDF, финальный 2226 | Два независимых export→upload цикла: nonroot, read-only, network none, 1 GiB RAM/swap cap, `/tmp` 256 MiB, 0.55 CPU, 256 PID, `cap_drop ALL`, no-new-privileges. Peak **187 547 648 байт**, OOM=false; font/glyph/source preflight PASS |
| Frontend runtime smoke | Exact image: nonroot/read-only, 768 MiB cap, healthy/OOM=false; Zerde и прежние основные маршруты ответили 200 |

PDF-операции выполняются отдельными интерпретаторами, максимум два одновременно на API worker. Очередь ограничена 5 с, операция — 45 с, Linux child — 256 MiB address space, 30 с CPU, 12 MiB file size; timeout/cancel завершают и reap процесс до удаления временных файлов. Native MuPDF не исполняется в API thread pool.

Times New Roman получен из исходного `times32.exe` Core Fonts for the Web с закреплённым SHA256 `db56595ec6ef5d3de5c24994f001f03b2a13e37cee27bc25c58f6f43e8f807ab`, без копирования шрифтов из Windows. Оригинальный архив и EULA сохранены в image, хеши всех четырёх начертаний и все 18 казахских букв проверяются build gate. Исходные proofs F810 сохранены. Финальные `READY.json`, `operator-image-manifest.json`, `backend-source-proof.json`, `backend-linux-readiness.json`, `linux-focused-tests.log` находятся отдельно в приватном `hotfix-2226c33/`.

| Pin | Финальный backend 2226 | Frontend 2ac |
| --- | --- | --- |
| Local image / OCI index ID | `sha256:fe99d63ad7db0b24c8f4508e7261b4c14a7e04c38615ae412605c3c7f2326886` | `sha256:0e4e885948ad5304563165dfc14f0ca894a982938c73ff9e3348def2a4e20d7a` |
| Linux platform manifest | `sha256:01f71c531d4afe6c33926eb7f85b5fac109f0346aa7fdd09125b40ff1f2061a2` | `sha256:1705f12c0b92d41e0e3373f7843ad128e547d6fa980517b831f16372dc27dd43` |
| Config digest | `sha256:0fc8bd30867cb8ee6906c63bb56f13c1cd7f15348d909d655561b4098fb96ffe` | `sha256:5aa53c71293bf684c083f8f1a077b7a4d040e83194ecc0e317b728c1f347a28b` |
| Full gzip bytes | `690491573` | `127288058` |
| Gzip SHA256 | `fcaeff2c1bb4125464f45ef9771dc6bdb37b8de66a9d514236976bd7aeb3141b` | `7157e49df8e0ccc4d803c1116d0f6caeeacdfcf976966f063b5b1a6f59d25591` |

Архивы названы `sanduai-{backend|frontend}-{полный SHA}.tar.gz`. Исходные manifests/`RESOLVED.json` F810 не перезаписываются. Manifest 2226 с пятью Git-byte pins связан с отдельным `EXT/PINNED.json`; SHA256 локального `operator-image-manifest.json` — `7b178d23fa05a669f6b6dbac93ede5969c93733fb79b4a530ee000e4750ea13e`. Приватные образы и backup не публикуются в общедоступных артефактах.

## Схема и выбор резервной копии

Zerde добавляет `zerde_projects`, `zerde_documents` и `zerde_ai_usage`. Исходные файлы Zerde хранятся в PostgreSQL `BYTEA`, метаданные/содержимое проекта — в PostgreSQL JSONB. Реальный журнал ИИ хранится отдельно от заменяемого результата и срока жизни generation jobs. Шаблоны строятся в памяти, PDF использует приватные временные файлы и отдельные процессы.

Проверяемый путь миграции: `20261019_video_studio` → `20261030_zerde` → `20261030_zerde_usage`. Точный release image обязан иметь один head и непрерывный путь без merge/dependencies. Нельзя считать старый no-schema оператор Preschool подходящим для этой миграции: он намеренно требует одинаковые source/target и не выполняет DDL.

Runbook допускает **явный `postgresql-only` для миграции только PostgreSQL**. Такой профиль применим к Zerde лишь после подтверждения, что точный release diff не меняет файловые данные/форматы, зависимости storage и прежние persistent volumes. Тогда исключение файлов фиксируется в manifest, а оператор повторно подтверждает `CONFIRM_FILE_VOLUME_BACKUP_OMISSION=YES` при backup и `CONFIRM_POSTGRESQL_ONLY_MIGRATION=YES` при миграции. Это технические подтверждения проверенного объёма, а не повод повторно спрашивать уже данное разрешение на релиз.

Если фактический объём затрагивает persistent files, нужен `full-current`: PostgreSQL, `media_data`, `presentation_data`, `document_jobs`, Redis. Нельзя выдавать PostgreSQL-only пакет за восстановление этих файлов. Legacy Presenton по последним отчётам выведен из эксплуатации; его исторические артефакты не удаляются и искусственный `fastapi.db` не создаётся. Временные video rows/volume исключаются только по действующему runbook, при сохранении схемы и финансового ledger.

Выбранный и закреплённый в `RESOLVED.json` scope: **`postgresql-only`**, `file_volume_changes=false`. Основание — проверенный diff в `REVIEWED-SCOPE.json`: Zerde хранит файлы в PostgreSQL, прежние persistent volumes и форматы не меняются. Первый backup **`20261102T110248Z`**, native restore rehearsal, миграция и offsite — **PASS**. Для forward-fix выполнен второй свежий backup **`20261102T124213Z`** текущей схемы с двумя QA-аккаунтами; его native TARGET/TARGET rehearsal и authenticated offsite/bind — **PASS**.

## Обязательные gates до изменения схемы

1. **Точная версия и ресурсы.** Чистые checkout, полный SHA в tag и OCI label, проверенный image content ID/digest, prebuilt images вне production, `pull_policy: never`. Нет production build/pull подменённого образа. Проверяются отдельные API/document/presentation/generation/video workers, прежние environment/security/CPU/RAM/PID/mount profiles и соответствие памяти хоста. Текущий широкий профиль требует ≥6080 MiB доступных Docker при 4480 MiB backend +768 MiB frontend +832 MiB запаса; PostgreSQL connection budget оставляет минимум 20 соединений до `max_connections`. Сумма считается по фактическим процессам и пулам.
2. **Quiescence.** Проверенный maintenance блокирует новые публичные запросы; API останавливается, текущие оплаченные задания завершаются естественно. Очереди, reserves и состояния `queued/running/settling/refunding`, а также неопределённые отправки не принудительно очищаются и не повторяются. После нулевой активности останавливаются все четыре workers и Redis; PostgreSQL продолжает работать. Фиксируются fingerprints исходных пользователей/балансов/transactions/reservations, identities контейнеров и volumes. Наличие флага freeze само по себе не останавливает writes.
3. **Свежий native backup.** Новый timestamp-каталог, custom PostgreSQL dump, globals, restore list, manifest v5 и SHA256SUMS; при полном scope — соответствующие файловые архивы. Manifest связывает source/target revisions, DB system identity, Compose project, release Git/image/content ID и scope. Не старше 6 часов по реальному времени создания, не по изменённому mtime. Старые backup/release не удаляются.
4. **Настоящий restore rehearsal.** Закреплённый PostgreSQL image/digest, отдельные scratch volume/container, восстановление dump и проверка source revision. Тот же exact release image выполняет `alembic upgrade head`, `alembic check` и проверку целевого head на восстановленной БД. Native `RESTORE-REHEARSAL.ok` связан с manifest/SHA256SUMS. Архивный integrity-test без восстановления не заменяет этот gate. Удаляются только созданные rehearsal scratch-ресурсы.
5. **Зашифрованный offsite.** Полный комплект выбранного scope, включая manifest/checksums/rehearsal marker, сохраняется вне сервера в новом приватном пакете; каждый cipher record и исходный SHA256/размер проверяются. Offsite proof связывается с тем же backup и его digest до миграции. Поддельные marker, частичная передача и исторический пакет не считаются текущим proof.
6. **Одна контролируемая миграция.** `migrate.sh` запускает только основной оператор после gates. `CONFIRM_MIGRATION`, `APPLICATION_WRITES_FROZEN`, `CONFIRM_POST_MIGRATION_ROLLBACK_LIMITS` и выбранный scope отражают уже выполненные условия. Сверяются свежесть backup, marker, точные SHA/content ID, текущая source revision/DB identity, нулевая активность и единственный target head. API/workers остаются остановленными до завершения; Alembic не прячется в старте API.

Исходные production freeze/backup/rehearsal/offsite/migration выполнены. Для forward-fix повторно выполнены freeze, свежий snapshot текущей схемы, изолированное восстановление и offsite; повторная production-миграция не запускалась. Итоговый runtime 2226 проверен до и после открытия ingress.

## Исходный stage и продолжение через forward-fix

Исходный `ops/release.py`, связанный с `RESOLVED.json`, выполнил `stage`/`prepare`, maintenance/drain, backup, restore rehearsal, offsite, контролируемую миграцию и запуск F810/2ac. Тогда все 8 сервисов были healthy; `NEW-RUNTIME-HEALTHY.json` не открывает ingress. QA остановилась на истории терминального задания, публичный write boundary не пересекался.

Продолжение выполняет отдельный `forward_fix.py` в `EXT=/opt/sanduai/releases/zerde-20261102/forwardfix-2226c332`:

1. `stage`/`prepare` — **PASS**: 2226 доставлен, полный архив и image загружены, extension подготовлена и запечатана. Исходный seal и manifests F810 сохраняются.
2. `freeze` — **PASS**: maintenance/drain, остановка writers, новый native PostgreSQL backup **`20261102T124213Z`** текущей схемы с двумя QA-аккаунтами. Его отдельный `FROZEN-INCLUDING-QA.json` не заменяет исходный pre-QA `ROOT/FROZEN-CORE.json`.
3. `rehearsal`/`bind-offsite` — **PASS**, exit 0: изолированный restore нового dump, same-image проверка `20261030_zerde_usage` → `20261030_zerde_usage`, новый AES-GCM/DPAPI offsite шести артефактов. Production DDL отсутствует.
4. `cutover` — **PASS**, exit 0: пять backend-приложений заменены на 2226. PostgreSQL, Redis, frontend 2ac и их volumes/identities сохранены; прежние env/resources/security/healthcheck profiles сверены.
5. Guarded `run_qa_forward.py prepare`/`run` — **PASS**, exit 0: точное owned QA-состояние восстановлено, в context изменён только backend. Двум usage добавлены приватные snapshots после сверки canonical payload hash и namespaced Idempotency-Key. Jobs, credits и ledger не переписывались; два исходных HTTP intents/IDs использованы повторно без новых платных заданий вместо них.
6. Финальная API/history-приёмка 2226, отдельный реальный платный UI job, `adopt-ui-job`, `ledger`, адресный `cleanup` и assembly feature proof — **PASS**, exit 0. После cleanup восстановлен **исходный pre-QA** user/financial baseline, а не временный snapshot с QA.
7. `pointer`/`reopen` — **PASS**, exit 0. Public-write markers записаны до nginx reopen, исходный и extension seals проверены. Внешний HTTPS/runtime smoke после открытия — **PASS**; автоматический rollback после пересечения write boundary не применяется.

## Подтверждённый исходный offsite и новый backup gate

Первый Zerde backup **`20261102T110248Z`** восстановлен в изолированный PostgreSQL, проверен переход с `20261019_video_studio` на `20261030_zerde_usage` тем же F810 image. Его шесть артефактов переданы в новый приватный offsite-пакет; все AES-256-GCM records и исходные SHA256/размеры проверены, ключ защищён Windows DPAPI CurrentUser. **PACKAGE SHA256: `214e70368b77f890cb379f2b94f44c79a48d5876bfe75b2cccd3ac3ca937a0d7`.**

Комплект: `database.dump`, `globals.sql`, `database.restore-list.txt`, `RELEASE-MANIFEST.txt`, `SHA256SUMS`, `RESTORE-REHEARSAL.ok`. Односеансовый streaming-adapter проверяет frozen metadata до/после, размеры и footer; локальный decrypt-to-sink проверяет GCM records без сохранения plaintext. Весь пакет, recovery-скрипт и исходный Windows профиль с DPAPI keys нужны для восстановления.

Исторические Preschool/KMZH пакеты и scripts сохранены. Их нельзя выдавать за текущий backup либо за `full-current`. Для extension подготовлен отдельный adapter текущего TARGET/TARGET scope, исходные scripts/proofs не перезаписываются.

Новый backup текущей схемы: **`/opt/sanduai/releases/zerde-20261102/forwardfix-2226c332/backups/frozen/20261102T124213Z`**. Native TARGET/TARGET rehearsal и `bind-offsite` завершились exit 0. Все шесть новых артефактов аутентифицированы, plaintext SHA256/размеры совпали; **PACKAGE SHA256: `f92c49368545df5e8a1c4f92436f211fd743d2f64f4e0c4d049854e5cd274be5`**, source `SHA256SUMS` SHA256 — `e7aee0bb374115018d3b7d5b9132e3b85e4c6006cb2a6f5f49e48380f5a7cfa7`. Это отдельный комплект с двумя завершёнными QA-консультациями, а не повторное использование первого backup.

## Фактическая production-приёмка

| Production-проверки на этапах F810 → 2226 / frontend 2ac | Результат |
| --- | --- |
| API: 14 режимов × RU/KK, 32 DOCX/PDF, реальные uploads, owner/private проверки, параллельные PDF | **PASS** |
| Реальный LLM через очередь: KK и RU | Оба задания completed/captured, ровно **10 монет каждое**; повтор idempotency не создал новых jobs/captures |
| История завершённого задания | Дефект 409 исправлен в 2226; production API и generic history deep link восстанавливают точный request/result после правки проекта и reload — **PASS** |
| Браузер: обычный login, навигация, форма, TXT upload, бесплатный assess, save и cloud reopen | **PASS** через обычный UI; 14 browser checks, 0 console warnings/errors |
| Реальные Word/PDF downloads и TNR preview, RU/KK, mobile 390 px | **PASS**, горизонтального overflow нет; frontend остаётся тем же 2ac |
| Classic КМЖ, Open lesson, Preschool | **PASS**: существующие UI/формы и metadata. Open lesson: Математика, 4 класс, **69 доступных целей обучения**. Дополнительные платные regression generations этих функций не запускались |
| Реальная платная UI-консультация, AI log и декларация | **PASS**: completed/captured 10, персональные рекомендации, один AI usage, сохранённые авторские notes и PDF-декларация с ними в Times New Roman |
| Итоговый ledger | **PASS**: 3 jobs, 3 reservations, 3 debits/captures по **10**, без дополнительных списаний; перед cleanup owner **970.00**, observer **1000** |
| Адресный cleanup | **PASS**: два owned QA-аккаунта удалены штатным admin API; их jobs/reservations/Zerde rows отсутствуют, исходные users/financial fingerprints восстановлены. Browser reload перенаправил на login |

Реальный UI job: `ae3c4734-ff6d-4b6b-a8d9-c104079ca11a`. Его cloud recovery, generic history deep link, редактирование notes и фактический PDF проверены до удаления QA. Доказательства: `qa-artifacts/API-VERIFIED.json`, `LEDGER-VERIFIED.json`, `CLEANUP-VERIFIED.json`, `browser-proof.json`; `FEATURE-QA-VERIFIED.json` связывает их с exact 2226/2ac, исходным seal и новой extension.

Внешний публичный smoke **2 ноября, 13:12:02 UTC**: все **10 HTTPS URL ответили 200**, все **10 readiness checks — ok**, **8 exact services healthy**, OOM=false, схема `20261030_zerde_usage`, backup timer active. Подтверждение — `PUBLIC-PRODUCTION-VERIFIED.json`. Это проверка доступности, readiness и runtime; дополнительные платные генерации прежних функций в неё не входят.

## Сохранённый runtime и граница публичных writes

PostgreSQL/Redis container IDs и все прежние volumes сохранены; второго stateful-стека на общих volumes не создавалось. На этапе forward-fix пересозданы только пять backend-приложений, frontend 2ac сохранён. Прежние env, CPU/RAM/PID, read-only/tmpfs, security и healthcheck profiles сверены с baseline.

Фактическое maintenance-окно: **`2026-11-02T11:02:24.434677+00:00` → `2026-11-02T13:10:29.503280+00:00`**, около **2 ч 8 мин** (19:02 → 21:10 Asia/Shanghai). Публичный доступ открывался после cleanup и feature proof.

До открытия проверены `/health/live`, `/health/ready`, exact revision/image IDs, target schema, все восемь healthy services, отсутствие OOM, nginx syntax/timeouts и реальный TNR PDF под прежними лимитами. Процессная изоляция одновременных PDF подтверждена отдельно; native MuPDF выполняется вне API thread pool.

Закрытая API/browser-приёмка выполнена на двух собственных временных QA-аккаунтах через HTTPS maintenance exception. Она покрыла каталог/допуск, реальные upload/save/reopen, owner/noauth/foreign access, DOCX/PDF, KK/RU консультации через очередь, idempotency/capture, журнал помощи и заполненную декларацию. Mobile RU/KK 390 px проверен без горизонтального overflow; прежние Classic/Open lesson/Preschool проверены в указанном выше объёме.

QA очищена адресно штатным API после завершения оплаченных работ. До публичного открытия исходные user/financial fingerprints совпали с frozen baseline, активные очереди/reserves отсутствовали. Feature proof связан с реальными отчётами, downloads/screenshots и exact images. QA-credentials, env и необработанные private logs в Git не помещаются.

## Откат и граница новых данных

В отличие от October application-only релизов, **исходный backend 82da не является обычным rollback после Zerde DDL**: exact-schema readiness ожидает старый Alembic head. `alembic downgrade` запрещён.

До открытия ingress существовала отдельная контролируемая граница для rehearsed pre-migration restore при полностью frozen writes либо проверенного schema-compatible image, с сохранением всех новых таблиц/данных. Простое удаление трёх Zerde-таблиц недопустимо. После состоявшегося публичного открытия эта pre-ingress возможность не применяется.

Перед открытием записаны `INGRESS-REOPENING` исходного stage и extension. После этой границы запрещены автоматический rollback и восстановление старого dump поверх новых регистраций, reset-токенов, балансов и ledger. Допустимы проверенный schema-compatible image либо data-aware forward repair с сохранением новых данных. Старые images, backup/offsite/recovery evidence и volumes сохранены.

## Текущая ведомость доказательств

| Evidence | Статус |
| --- | --- |
| Прочитаны полный runbook и последние deployment reports | Выполнено независимым аудитом |
| Установлен новый schema/storage scope | Выполнено: reviewed diff, три новые PostgreSQL-таблицы, `postgresql-only`; файловые volumes без изменений |
| Исходный baseline/preflight, maintenance/drain и migration graph | Выполнены для исходного stage; его seal, volumes/environment/resources и pre-QA fingerprints сохраняются |
| Первый native backup / restore+target-upgrade rehearsal / offsite | **PASS**, `20261102T110248Z`, PACKAGE SHA256 `214e70368b77f890cb379f2b94f44c79a48d5876bfe75b2cccd3ac3ca937a0d7` |
| Production migration и промежуточный F810 target readiness | **PASS**: `20261019_video_studio` → `20261030_zerde_usage`; на этом этапе все 8 сервисов healthy, ingress ещё закрыт |
| Финальный 2226: Git/images/transport и extension seal | **PASS**: заморожен, запушен, проверен и доставлен/загружен; stage/prepare завершены |
| Exact-image tests и 32 экспорта / 40 страниц | F810 полный baseline и визуальная проверка PASS; 2226 95 focused Linux/Windows, Ruff, source/font/parallel preflight PASS |
| Закрытые реальные API/browser/Word/PDF проверки | **PASS**; history-дефект найден до открытия, исправлен в 2226 и повторно проверен в production |
| Новый TARGET/TARGET backup/rehearsal/offsite | **PASS**, `20261102T124213Z`, PACKAGE SHA256 `f92c49368545df5e8a1c4f92436f211fd743d2f64f4e0c4d049854e5cd274be5`; bind exit 0 |
| Замена пяти backend apps и final runtime 2226 | **PASS**, cutover exit 0; exact runtime 2226/2ac, 8 healthy, OOM=false |
| QA-state restore/hash backfill, повтор API/history 2226 | **PASS**, prepare/run exit 0, исходные paid intents сохранены |
| Платный UI job, итоговый ledger, адресный cleanup до исходного pre-QA baseline | **PASS**, adopt/ledger/cleanup exit 0; 3 captures по 10, исходный baseline восстановлен |
| Feature proof, release pointer и публичное открытие | **PASS**, assemble/pointer/reopen exit 0; открыто `2026-11-02T13:10:29.503280+00:00` |
| Внешний публичный HTTPS/runtime smoke | **PASS**, exit 0; 10 URLs 200, 10 readiness checks ok, 8 healthy/no OOM, backup timer active |

Публичный snapshot `2026-11-02T13:12:02.374688+00:00` подтвердил healthy/no OOM и активный backup timer. Наблюдение **`13:15:04 UTC`** также **PASS**: после открытия 0 nginx 5xx и 0 ERROR/CRITICAL/Traceback в логах шести приложений; PostgreSQL **12/50 connections**, 0 waiting locks и long active transactions; Redis 0 evictions/rejected connections. На хосте доступны около **6.18 GiB RAM** и **61.2 GiB диска**, backup timer active; в момент среза активных платных работ не было.

| Доказательство | SHA256 |
| --- | --- |
| Публикуемый `DEPLOYMENT-ZERDE-2026-11-02.evidence.json` | `2e5533204d8eeb3c1afe6e45ba02fb9037a7ab03483f14ceec257bf74fe94355` |
| `FEATURE-QA-VERIFIED.json`, локальный архив оператора | `f8b8e857865aa5f000cd90cca50e145eaedbb38ff5c8ac2edfc03a279d716cdf` |
| `PUBLIC-PRODUCTION-VERIFIED.json`, локальный архив оператора | `60cb3c26c7aebe83d38908ecb3f5066d226215d9ba72abb17695355392cc6b61` |
| `POST-OPEN-OBSERVATION.json`, локальный архив оператора | `15d60bef86ba4201fc8bccee37c9bef73cd8456b44c6b9b55865ba45eb7c035f` |

Исторические images, оба backup/offsite комплекта, recovery evidence и volumes сохранены. Сырые QA-state/ledger, credentials, env и приватные артефакты остаются в архиве оператора; вместе с отчётом публикуется только указанная обезличенная сводка.
