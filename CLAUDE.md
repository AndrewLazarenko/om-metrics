# OM Metrics — публичный веб-дашборд для OnlyMonster

Общий контекст агентства → `../CLAUDE.md`

Static React app. Деплой — Vercel. Репо — GitLab private. Производная от `../api-chatter-metrics/chatter_metrics.gs`.

## Что это
Пользователь вставляет свой OM auth-token, приложение тянет `/users/metrics` + `/members` прямо из браузера (CORS открыт), хранит в IndexedDB, рисует две heatmap-таблицы. Ни бэкенда, ни трекинга, ни баз данных на наших серверах.

## Ключевые файлы
| Файл | Что |
|------|-----|
| `src/lib/formulas.ts` | `toDerived` — парность с `chatter_metrics.gs` |
| `src/lib/kyiv-dates.ts` | `getKyivDayRange` с DST |
| `src/lib/om-api.ts` | Клиент OM API с retry и пагинацией |
| `src/lib/sync.ts` | Оркестрация sync |
| `src/lib/db.ts` | Dexie schema |
| `src/lib/store.ts` | Zustand stores |
| `src/components/Dashboard.tsx` | Основной экран |

## Команды
```bash
npm run dev           # dev server
npm test              # unit + snapshot tests
npm run build         # production build
npx vercel --prod     # deploy
```

## Деплой
- Домен: `bubbleteam-metrics.vercel.app`
- Vercel проект привязан к GitLab repo `bubbleteam-metrics` (private)
- Перед `vercel --prod` — прогнать `docs/smoke-checklist.md`

## Принципы
- Ноль трекинга (ни Sentry, ни GA, ни PostHog)
- Ноль бэкенда — токен никогда не покидает браузер
- Формулы — 1-в-1 как в Apps Script, подтверждается snapshot-тестами `parity.test.ts`
