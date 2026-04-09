# OM Metrics — публичный веб-дашборд для OnlyMonster API

**Дата:** 2026-04-09
**Автор:** Andrew (BubbleTeam) + Claude (брейнштрм)
**Статус:** Draft (на ревью владельца)
**Репо:** `/sessions/peaceful-admiring-fermat/mnt/bubbleteam-hub/om-metrics/` (новый проект в BubbleTeam-хабе)

---

## 1. Цель и контекст

### Зачем это делается

Andrew — владелец OnlyFans/Fansly агентства BubbleTeam. Внутри у него уже работает Apps Script `api-chatter-metrics/chatter_metrics.gs`, который тянет метрики чатеров из OnlyMonster API в Google Sheets и рисует дашборд вручную собранный в таблице.

Задача — взять этот внутренний инструмент и выпустить публично как "бесплатный подарок аудитории" в личный Telegram-канал `@bubbleteam`. Конечная цель — **самореклама**: показать, что BubbleTeam делает технологичные вещи, получить органические репосты в другие каналы, усилить бренд.

Пост в ТГ-канале пишет сам Andrew — наша задача построить только сам инструмент, который в посте будет героем.

### Non-goals

- Не зарабатывать с этого инструмента
- Не собирать емейлы / лиды
- Не привязывать аудиторию (никакой "sign up to keep using")
- Не отслеживать пользователей (никакой аналитики на клиенте)
- Не строить команду разработки вокруг — Andrew делает один раз и забывает
- Не решать проблемы всех agency-workflows (смены, выходные, маппинг команд — всё это BubbleTeam-специфично и остаётся во внутренних инструментах `tg-reminder`, `bubbleteam-tracker`)

### Что было рассмотрено и отвергнуто

| Вариант | Почему отвергли |
|---|---|
| Google Sheets template + Apps Script | Высокий фрикшн установки (копирование таблицы → открытие Apps Script → пугающее "unverified app" warning). Не фотогенично — не сделать красивый пост со скриншотом. |
| MVP с бэкендом (Node + Postgres) | Хранение чужих OM-токенов на сервере Andrew создаёт юридическую ответственность и операционную нагрузку. Цель не оправдывает. |
| Один HTML-файл vanilla JS | Выбывает из-за требования "максимально красиво". Полированный UI на vanilla потребовал бы столько же времени как React + shadcn. |
| Telegram Mini App | Требует валидации initData, привязывает пользователей к Telegram, усложняет деплой. Отложено как возможный v2. |

---

## 2. Scope v1

### Пользовательский поток

1. Пользователь открывает ссылку из поста в TG-канале → попадает на landing-страницу.
2. Вставляет свой OnlyMonster auth-token в поле → жмёт "Загрузить".
3. Видит прогресс-бар: "загружаю метрики, 14 из 20 дней готово".
4. Попадает на дашборд. Сверху — селектор чатеров с поиском. Под ним — две таблицы (Деньги + Активность) с hitmap-раскраской ячеек.
5. Выбирает чатера → таблицы фильтруются по нему.
6. Переключает окно: 7 / 14 / 20 / 30 дней.
7. Может открыть Настройки: длина смены (для Msg/Hour), процент комиссии, тема.
8. Может открыть Info-модалку: "что это", "где живут данные", "как получить токен", ссылка на `@bubbleteam`.
9. Может нажать "Обновить" — инкрементальный sync за последние 7 дней.
10. Закрывает вкладку. Возвращается через день → всё на месте, фоном докачивается сегодняшний день.

### Список функций

Включено:

- Ввод OM токена, хранение в localStorage
- Sync метрик из `GET /users/metrics` за последние N дней (N ∈ {7,14,20,30}, дефолт 20)
- Sync имён чатеров из `GET /members` (только поля `id`, `name`)
- Инкрементальный refresh (backfill последних 7 дней)
- Селектор чатера с поиском по имени
- Две таблицы "Деньги" и "Активность" с heatmap-раскраской
- Строка "Итого/Среднее" внизу каждой таблицы
- Переключатель окна 7/14/20/30 дней
- Настройки: shiftHours (дефолт 6), commissionRate (дефолт 0.2), тема
- Landing / empty state с брендингом и ссылкой на `@bubbleteam`
- Info-модалка с описанием, инструкцией получить токен, кнопкой очистки данных
- Тёмная / светлая тема
- Клавиатурные шорткаты базовые (Esc закрывает модалки, `/` фокус на поиск)

Не включено (YAGNI для v1):

- Графики и чарты
- Аватарки чатеров
- Фильтр по моделям/креаторам
- Группы/команды чатеров, создаваемые пользователем
- Чарджбеки, net-sales с учётом возвратов
- Sold posts, post activity
- Work time / break time из API
- Экспорт в CSV / PDF
- Сравнение периодов
- Мультиязычность UI (только русский v1; английский — v2)
- Регистрация, аккаунты, авторизация
- Аналитика, трекинг, Sentry

### Метрики из `/users/metrics` (те же что в `chatter_metrics.gs`)

Сырые поля, которые читаем:

```
tips_amount_sum
sold_messages_price_sum
fans_count
messages_count
reply_time_avg
media_messages_count
paid_messages_count
sold_messages_count
internal_templates_count
copied_messages_count
paid_messages_price_sum
words_count_sum
ai_generated_messages_count
```

Производные (считаем один раз при записи в IndexedDB):

```
grossSales      = tips_amount_sum + sold_messages_price_sum
sales           = round2(grossSales * (1 - commissionRate))
msgPerHour      = messages_count / shiftHours
chatPerHour     = fans_count / shiftHours
replyMinutes    = reply_time_avg / 60
openRate        = paid_messages_count ? sold_messages_count / paid_messages_count : 0
avgPriceSent    = paid_messages_count ? paid_messages_price_sum / paid_messages_count : 0
avgPriceSold    = sold_messages_count ? sold_messages_price_sum / sold_messages_count : 0
```

Колонки в UI таблице "Деньги":

`Дата | Продажи ($) | Free Media | PPV Sent | PPV Sold | Open Rate | Avg Price Sent | Avg Price Sold`

Колонки в UI таблице "Активность":

`Дата | Chats | Messages | Msg/Hour | Chat/Hour | Avg Resp Time | Words | AI`

Где `Free Media = media_messages_count`, `PPV Sent = paid_messages_count`, `PPV Sold = sold_messages_count`, `Chats = fans_count`, `Words = words_count_sum`, `AI = ai_generated_messages_count`, `Avg Resp Time = replyMinutes`.

---

## 3. Архитектура

### Стек

- React 18 + TypeScript
- Vite (dev + build)
- Tailwind CSS + shadcn/ui (Combobox, Table, Dialog, Tooltip, Button, Input, Select, Toaster, Skeleton)
- Lucide-react — иконки
- Dexie.js — обёртка над IndexedDB
- Zustand — локальный стор
- date-fns + date-fns-tz — даты и таймзоны

Не используется: React Router, Redux, react-query, axios, любой бэкенд.

### Хостинг

- **Vercel** (статика)
- Git: **GitLab, приватный репозиторий**. Владелец — Andrew, бэкап кода живёт у GitLab плюс Vercel делает свою копию при деплое.
- URL на старте: `bubbleteam-metrics.vercel.app` (кастомный домен можно прикрутить потом без изменений в коде)
- Лицензия: **нет** (проприетарный, приватный). Исходники видит только владелец. Trust signal в посте строится на тексте и визуале ("токен хранится в браузере, открой DevTools → Network — ни одного запроса на наши сервера"), а не на "смотри исходники".

### Хранилище в браузере

IndexedDB (через Dexie):

```
metrics table
  primary key: "YYYY-MM-DD|userId"
  date:    string "YYYY-MM-DD" (Europe/Kyiv)
  userId:  number
  raw:     { все 13 полей из /users/metrics }
  derived: { sales, msgPerHour, chatPerHour, openRate, avgPriceSent, avgPriceSold, replyMinutes }
  syncedAt: ISO timestamp

members table
  primary key: id (number)
  name: string

meta table (single row)
  lastMetricsSyncAt: ISO
  lastMembersSyncAt: ISO
  syncedDates: string[]
```

localStorage:

```
omToken   — OM auth token (в открытом виде, с предупреждением в UI)
settings  — { shiftHours: 6, commissionRate: 0.2, windowDays: 20, theme: 'dark' }
```

### Структура репо

```
om-metrics/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Landing.tsx
│   │   ├── ChatterSelector.tsx
│   │   ├── PeriodSwitcher.tsx
│   │   ├── MoneyTable.tsx
│   │   ├── ActivityTable.tsx
│   │   ├── HeatmapCell.tsx
│   │   ├── SettingsDialog.tsx
│   │   ├── InfoDialog.tsx
│   │   └── ui/ (shadcn components)
│   ├── lib/
│   │   ├── om-api.ts         (клиент OM API: fetchMetrics, fetchMembers, retry, pagination)
│   │   ├── formulas.ts       (toDerived, sum/avg, num, round2)
│   │   ├── kyiv-dates.ts     (getKyivDayRange, timezone math)
│   │   ├── db.ts             (Dexie schema, bulkPut, queries)
│   │   ├── sync.ts           (initial sync, incremental sync, orchestration)
│   │   ├── heatmap.ts        (color scale, inverted, edge cases)
│   │   └── store.ts          (Zustand stores: token, settings, selection, sync status)
│   └── __fixtures__/         (anonymized OM API responses for tests)
├── src/__tests__/
│   ├── formulas.test.ts
│   ├── kyiv-dates.test.ts
│   ├── heatmap.test.ts
│   ├── om-api.test.ts        (MSW mocks)
│   ├── sync.test.ts
│   └── parity.test.ts        (snapshots: same input → same output as Apps Script)
├── public/
├── docs/
│   ├── superpowers/specs/2026-04-09-om-metrics-design.md  (этот файл)
│   └── smoke-checklist.md
├── index.html
├── tailwind.config.ts
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 4. UI / Layout

### Header (sticky, top)

| Слева | Справа |
|---|---|
| Текстовый лого `BubbleTeam Metrics` + маленькая иконка | Иконка TG → `https://t.me/bubbleteam`, кнопка Settings (шестерёнка), кнопка Info (ℹ️), переключатель темы (☀/🌙), кнопка "Обновить" с прогресс-индикатором |

Высота ~56px, фон с лёгкой прозрачностью на scroll.

### Панель селекторов (sticky под Header'ом)

| Слева | Центр | Справа |
|---|---|---|
| Combobox "Чатер" — поиск по имени, один выбор, показывает количество найденных чатеров | Таблетки `7д \| 14д \| 20д \| 30д`, активная выделена | Текст "обновлено X минут назад", значок предупреждения если данные устарели |

Под панелью — тонкая 2px полоса прогресса во время sync.

### Основная зона — две таблицы

На десктопе (≥1280px) — две таблицы бок о бок. На узких экранах — одна под другой.

**Таблица "Деньги":** `Дата | Продажи ($) | Free Media | PPV Sent | PPV Sold | Open Rate | Avg Price Sent | Avg Price Sold`

**Таблица "Активность":** `Дата | Chats | Messages | Msg/Hour | Chat/Hour | Avg Resp Time | Words | AI`

Каждая числовая колонка раскрашивается heatmap'ом по своему min/max (зелёный→жёлтый→красный, для `Avg Resp Time` шкала инвертирована). Колонка "Дата" — моноширинный шрифт, без раскраски.

Строка "Итого/Среднее" прилипает к низу таблицы: суммы для абсолютных колонок (Продажи, PPV Sent, PPV Sold, Messages, Free Media, Words, AI, Chats), средние для относительных (Msg/Hour, Chat/Hour, Open Rate, Avg Resp Time, Avg Price Sent/Sold).

### Landing / Empty state (до ввода токена)

Полный экран центрированный блок:

- Большой заголовок `OnlyMonster Chatter Metrics`
- Подзаголовок `Локальный дашборд для агентств — твой токен и данные живут только в браузере`
- Анимированный gradient background (ненавязчивый)
- Поле ввода токена + кнопка `Загрузить данные`
- Три карточки-плюшки: "🔒 Приватно", "⚡ Быстро", "🎁 Бесплатно, без регистрации"
- Подпись внизу: `Made by @bubbleteam` с иконкой TG, кликабельно

### Info-модалка

Открывается по ℹ️ в хедере. Содержит:

- Абзац "Что это такое"
- Абзац "Где живут мои данные" (честно: IndexedDB браузера + localStorage для токена)
- Короткая инструкция "Как получить OM токен" (F12 → Network → найти запрос к `omapi.onlymonster.ai` → скопировать заголовок `x-om-auth-token`)
- Кнопка "Очистить все данные" — стирает IndexedDB + localStorage, возврат на landing
- Строка "Made by @bubbleteam" с TG-иконкой

### Состояния

- Loading: Skeleton-плейсхолдеры на строках таблиц + полоса прогресса
- Empty (нет выбранного чатера): "Выбери чатера сверху чтобы увидеть метрики"
- Empty (у чатера нет данных за период): "У чатера нет метрик за выбранный период"
- Error (401/403): toast + модалка перевалидации токена, существующие данные в IndexedDB остаются видимыми
- Error (network): toast "Нет связи с OnlyMonster", retry-кнопка

---

## 5. Data flow и sync logic

### Первый запуск

1. Пользователь вставляет токен → сохраняем в localStorage.
2. Валидация: `GET /api/v0/members?limit=1`. 200 → ок, 401/403 → красная рамка + toast.
3. Фоном тянем полный `/members` (пагинация по 50, обычно 1-3 запроса) → пишем в `members` таблицу.
4. Фоном тянем `/users/metrics` для каждого дня из последних `windowDays`, от свежего к старому. Для каждого дня пагинация с limit=100 пока `items.length == 100`. После каждого дня — `bulkPut` в `metrics` + update progress.
5. Когда все дни загружены → пользователь видит полный дашборд.

### Повторный запуск

1. Читаем токен из localStorage → если есть, сразу идём на дашборд.
2. Читаем метрики из IndexedDB → **таблицы рисуются мгновенно без похода в API**.
3. Фоном проверяем `meta.lastMetricsSyncAt`:
   - > 6 часов назад → запускаем инкрементальный sync с baby-тостом "обновляю..."
   - < 6 часов назад → ничего, показываем "обновлено X минут назад"

### Инкрементальный sync

1. Re-fetch последние 7 дней (`BACKFILL_DAYS: 7` как в Apps Script).
2. `bulkPut` — upsert по ключу `date|user_id`.
3. Удаляем записи старше `now - windowDays`.
4. Обновляем `meta.lastMetricsSyncAt`.
5. Параллельно (раз в сутки) обновляем `/members`.

### Параметры API-клиента (копируются из Apps Script)

```ts
const OM_CONFIG = {
  BASE_URL: 'https://omapi.onlymonster.ai/api/v0',
  TZ: 'Europe/Kyiv',
  METRICS_PAGE_LIMIT: 100,
  MEMBERS_PAGE_LIMIT: 50,
  KEEP_DAYS: 20,
  BACKFILL_DAYS: 7,
  API_RETRIES: 4,
  API_RETRY_BASE_MS: 1200,
  PAGE_SLEEP_MS: 300,
  REQUEST_TIMEOUT_MS: 30000,
  AUTO_SYNC_THRESHOLD_MS: 6 * 60 * 60 * 1000,
};
```

Retry на `429` и `5xx` с exponential backoff. Не retry на `401/403/404/400`.

### Таймзоны

Все даты — `Europe/Kyiv`. Функция `getKyivDayRange(daysAgo)` возвращает `{ day: 'YYYY-MM-DD', from: UTC_ISO, to: UTC_ISO }`. Реализация через `date-fns-tz` с тестами на DST-переходы (29 марта и 25 октября 2026).

### Изменение настроек

- `shiftHours` или `commissionRate` меняются → пересчитываем все `derived` локально. Мгновенно, без API.
- `windowDays` уменьшается → просто визуальный фильтр, данные не трогаем.
- `windowDays` увеличивается → догружаем недостающие дни из API.
- Смена темы → мгновенно, только UI.

### Масштаб

| Параметр | Значение |
|---|---|
| Агентство со 100 чатерами, 20 дней | ~2000 строк в IndexedDB, ~1 MB |
| Первый sync | 20 дней × 1-2 страницы × ~400ms ≈ 10-15 сек |
| Инкрементальный sync | 7 дней × 1 страница ≈ 3-5 сек |
| Рендер таблиц | 20 строк × 8 колонок × 2 таблицы = 320 ячеек (без виртуализации) |

---

## 6. Error handling и edge cases

### Ошибки токена

- Пустое поле / невалидный формат — кнопка "Загрузить" disabled, валидация на фронте
- 401/403 при первом запросе — красная рамка, toast, фокус обратно в поле
- 401/403 во время sync (токен протух) — toast + модалка, существующие данные остаются видимыми

### Ошибки сети

- 429 / 5xx — exponential backoff, 4 попытки, затем toast
- Network error — retry 2 раза, затем toast, офлайн-режим с существующими данными
- Timeout > 30s — abort + retry
- Частичный успех (18/20 дней загружено) — показываем что есть, в сводке "2 дня не загрузились", кнопка "Докачать"

### Ошибки данных

- Чатер без имени в `/members` → показываем `ID: 12345`
- Чатер удалён из `/members` но остался в `/metrics` → используем последнее известное имя или fallback `(ID 12345)`
- `null` / отсутствующее поле → трактуем как 0
- Div by zero в формулах → показываем `—`, никаких `NaN`/`Infinity`
- Дубликаты ключей → `bulkPut` перезаписывает

### Ошибки настроек

- shiftHours ≤ 0 → не сохраняется, красная рамка
- commissionRate < 0 или > 1 → не сохраняется
- windowDays < 1 или > 30 → clamp в [1, 30]

### Ошибки браузера

- IndexedDB недоступен (Safari Private Mode) → fallback на sessionStorage + предупреждение "данные будут потеряны при закрытии"
- localStorage отключён → fatal screen "Включи localStorage"
- Две вкладки одновременно → `navigator.locks.request('om-sync', ...)` — вторая ждёт первую
- QuotaExceededError → toast "Недостаточно места в браузере"

### Не обрабатываем (YAGNI)

- Потеря сети в середине sync → retry руками
- Изменения в формате OM API → ломается, пушим фикс
- `<noscript>` блок — простое сообщение "включи JS"
- Продвинутая accessibility (только базовая от shadcn)

### Логгирование

- Никаких Sentry / PostHog / Google Analytics. Ноль отправки наружу. Принципиально.
- `console.log`/`console.error` для sync-событий и ошибок — пользователь открывает DevTools и видит сам.
- Фидбек — кнопка "Написать в @bubbleteam" в info-модалке.

---

## 7. Тестирование

### Инструменты

- Vitest (unit + snapshots)
- fake-indexeddb (Dexie в тестах)
- MSW (мок OM API)
- @testing-library/react — только для 1-2 критичных компонентов (Combobox, HeatmapCell)

### Что тестируем

1. **Parity с Apps Script** — главное. 3-4 анонимизированных фикстуры из реальных ответов `/users/metrics`, snapshot-тесты что `toDerived(item)` даёт идентичный результат формулам из `chatter_metrics.gs`.
2. **Таймзоны и DST переходы** — явные тесты на `getKyivDayRange` для 29 марта и 25 октября 2026.
3. **Heatmap edge cases** — пустая колонка, все нули, одно значение, инвертированная шкала, negatives.
4. **Dedupe / merge** — `bulkPut` с одинаковыми/разными ключами, пустой ответ.
5. **Retry logic** — MSW мок последовательности `429 → 429 → 200`, проверка backoff.
6. **Пагинация** — `items.length == 100` → запрос следующей страницы с увеличенным offset; `items.length < 100` → остановка.

### Что НЕ тестируем

- Компоненты по отдельности (overkill, smoke-test глазами)
- E2E через Playwright
- Performance / benchmarks
- Accessibility автоматом

### Smoke checklist перед `vercel --prod`

Файл `docs/smoke-checklist.md`, прогоняется глазами в incognito:

1. Landing рендерится, TG-иконка ведёт на `t.me/bubbleteam`
2. Вставляю OM токен → sync проходит с прогресс-баром
3. Combobox чатеров открывается, поиск фильтрует
4. Таблицы показывают данные за 20 дней, строка итогов на месте
5. Heatmap раскрашивает ячейки корректно
6. Переключение `7 / 14 / 20 / 30` работает
7. Настройки → shiftHours 8 → Msg/Hour пересчитался без API
8. Кнопка "Обновить" → инкрементальный sync срабатывает
9. Закрыл вкладку → открыл снова → данные на месте
10. Переключение темы работает
11. Info-модалка → "Очистить данные" → вернулся на landing

### Итого тестов

- ~15-20 unit (формулы, даты, heatmap, retry, pagination, dedupe)
- ~3-5 snapshot (parity с Apps Script)
- 0 E2E
- Прогон < 2 сек

### CI

Если выбран GitLab/Bitbucket — простой `.gitlab-ci.yml` / `bitbucket-pipelines.yml` на `npm ci && npm test && npm run build`. Если CLI-only — тесты руками перед деплоем.

---

## 8. Acceptance criteria

Все технические открытые вопросы (git host, публичность репо, домен) закрыты — см. секцию 3. Осталось одно:

**Acceptance владельца**: Andrew лично проходит smoke-checklist в prod-среде и одобряет перед постом в канале. Деплой в prod только после этого прохождения.

---

## 9. Глоссарий

- **OM** — OnlyMonster, SaaS для агентств которые управляют чатами на OnlyFans/Fansly
- **OM API** — `https://omapi.onlymonster.ai/api/v0`, требует заголовок `x-om-auth-token`
- **Chatter** — сотрудник агентства, который переписывается с фанами от имени модели
- **PPV** — Pay-Per-View, платные сообщения с медиа, которые фан покупает за отдельные деньги
- **IndexedDB** — встроенная в браузер база данных, хранится локально на диске пользователя, не отправляется на сервер
- **localStorage** — простое key-value хранилище в браузере, ~5-10 MB лимит
- **Dexie** — JavaScript библиотека-обёртка над IndexedDB
- **shadcn/ui** — не библиотека, а коллекция копируемых React-компонентов поверх Radix UI + Tailwind
- **CORS** — механизм браузера разрешающий/запрещающий запросы между разными доменами; OM API открыт для всех origins (`*`)
- **DST** — daylight saving time, переход на летнее/зимнее время; Киев переходит 29 марта и 25 октября 2026
