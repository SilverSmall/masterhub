// init-db.js
// Створює локальну SQLite базу masterhub.db з таблицею items
// і додає кілька тестових майстрів.

const Database = require("better-sqlite3");
const db = new Database("masterhub.db");

db.exec(`
  DROP TABLE IF EXISTS items;
  CREATE TABLE items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );
`);

const insert = db.prepare("INSERT INTO items (name) VALUES (?)");

const masters = [
    "Іван Ковальчук — сантехнік",
    "Олена Гриценко — електрик",
    "Петро Мельник — ремонт квартир",
    "Марія Бондаренко — клінінг",
    "Андрій Шевченко — монтаж меблів",
];

const insertMany = db.transaction((rows) => {
    for (const name of rows) insert.run(name);
});

insertMany(masters);

console.log(`Готово: додано ${masters.length} записів у таблицю items (masterhub.db)`);
db.close();
