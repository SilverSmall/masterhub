// server.js
const express = require("express");
const path = require("path");

const OrdersService = require("./service/orders.service");
const ordersRouter = require("./api/orders.routes");

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Репозиторій: SQLite для реального запуску.
// Якщо better-sqlite3 недоступний (наприклад, немає native build),
// можна тимчасово підставити InMemoryOrdersRepository.
let ordersRepository;
try {
    const SqliteOrdersRepository = require("./repository/SqliteOrdersRepository");
    ordersRepository = new SqliteOrdersRepository("masterhub.db");
} catch (e) {
    console.warn("SQLite repository unavailable, falling back to in-memory:", e.message);
    const InMemoryOrdersRepository = require("./repository/InMemoryOrdersRepository");
    ordersRepository = new InMemoryOrdersRepository();
}

const ordersService = new OrdersService(ordersRepository);

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.use(ordersRouter(ordersService));

app.listen(PORT, () => {
    console.log(`Сервер запущено: http://localhost:${PORT}`);
    console.log(`API:            http://localhost:${PORT}/orders`);
    console.log(`Health:         http://localhost:${PORT}/health`);
});
app.use((req, res) => {
    res.status(404).json({ error: "Not found", path: req.path });
});