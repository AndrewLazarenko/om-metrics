# BubbleTeam Metrics

Локальный дашборд для OnlyMonster API. Вставь свой токен — получи две таблицы с heatmap-раскраской. Все данные живут в твоём браузере.

🌐 **Live:** https://bubbleteam-metrics.vercel.app
📣 **Сделано:** [@bubbleteam](https://t.me/bubbleteam)

## Разработка

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # vitest
npm run build   # production bundle в dist/
```

## Приватность

- OM token хранится в `localStorage`
- Метрики — в `IndexedDB`
- Ни одного запроса на наши сервера. Открой DevTools → Network и убедись сам.
