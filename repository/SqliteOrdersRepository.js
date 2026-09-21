
const Database = require("better-sqlite3");
const Order = require("../domain/booking/Order");

class SqliteOrdersRepository {
    constructor(dbPath = "masterhub.db") {
        this.db = new Database(dbPath);
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        clientId TEXT NOT NULL,
        masterId TEXT NOT NULL,
        serviceId TEXT NOT NULL,
        scheduledAt TEXT NOT NULL,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
        this._counterStmt = this.db.prepare(
            "SELECT COUNT(*) as count FROM orders"
        );
    }

    nextId() {
        const { count } = this._counterStmt.get();
        return `o-${count + 1}-${Date.now()}`;
    }

    save(order) {
        this.db
            .prepare(
                `INSERT INTO orders (id, clientId, masterId, serviceId, scheduledAt, status, createdAt, updatedAt)
         VALUES (@id, @clientId, @masterId, @serviceId, @scheduledAt, @status, @createdAt, @updatedAt)
         ON CONFLICT(id) DO UPDATE SET
           scheduledAt = excluded.scheduledAt,
           status = excluded.status,
           updatedAt = excluded.updatedAt`
            )
            .run(order);
        return order;
    }

    findById(id) {
        const row = this.db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
        return row ? this._toOrder(row) : null;
    }

    findAll() {
        const rows = this.db.prepare("SELECT * FROM orders").all();
        return rows.map((r) => this._toOrder(r));
    }

    delete(id) {
        const result = this.db.prepare("DELETE FROM orders WHERE id = ?").run(id);
        return result.changes > 0;
    }

    _toOrder(row) {
        const order = new Order(
            row.id,
            row.clientId,
            row.masterId,
            row.serviceId,
            row.scheduledAt
        );
        order.status = row.status;
        order.createdAt = row.createdAt;
        order.updatedAt = row.updatedAt;
        return order;
    }
}

module.exports = SqliteOrdersRepository;