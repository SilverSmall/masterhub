# Практична 4 — MasterHub: контракт API + CRUD (Booking/Order)

## Що зроблено
- **ADR 0001** — обрано модульний моноліт (`docs/adr/0001-architecture-style.md`).
- **ADR 0002** — шарова архітектура `api/ → service/ → domain/` + `repository/` (`docs/adr/0002-layered-architecture.md`).
- **ADR 0003** — стиль REST і єдиний формат помилки (`docs/adr/0003-api-style-and-error-model.md`).
- **Контракт API** — `docs/api/openapi.yaml`, CRUD для `Order` (піддомен Booking з Практичної 3). Перевірено: валідний OpenAPI 3.0.3.
- **Реалізація CRUD** — `api/orders.routes.js` (HTTP), `service/orders.service.js` (валідація, use-cases), `domain/booking/Order.js` (з Практичної 3), `repository/` (in-memory для тестів + SQLite для реального запуску).
- **`GET /health`** — повертає `{ "status": "ok" }`.
- **Юніт-тести** — `tests/orders.service.test.js`, 4 тести (2 успішні, 2 помилкові), запускаються вбудованим тест-раннером Node.

## Як запустити

```bash
npm install
npm run init-db      # очистити й заново створити таблицю orders      # опційно, якщо хочеш почати з чистою SQLite-базою
npm start             # http://localhost:8080
npm test              # прогнати юніт-тести
```

## Перевірка вручну

```bash
curl http://localhost:8080/health
curl -X POST http://localhost:8080/orders \
  -H "Content-Type: application/json" \
  -d '{"clientId":"c-1","masterId":"m-1","serviceId":"s-1","scheduledAt":"2026-09-20T10:00:00Z"}'
curl http://localhost:8080/orders
```