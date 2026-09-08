// server.js
// Мінімальний бекенд: Express + SQLite
// Endpoint: GET /items -> повертає список майстрів з БД

const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();
const PORT = 8080;

const db = new Database("masterhub.db");

// Роздаємо клієнтську HTML-сторінку зі папки public/
app.use(express.static(path.join(__dirname, "public")));

// Головний endpoint практичної 1
app.get("/items", (req, res) => {
    const items = db.prepare("SELECT id, name FROM items").all();
    res.json(items);
});

app.listen(PORT, () => {
    console.log(`Сервер запущено: http://localhost:${PORT}`);
    console.log(`API:            http://localhost:${PORT}/items`);
});
