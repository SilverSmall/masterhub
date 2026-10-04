
const Order = require("../domain/booking/Order");
const { ValidationError, NotFoundError, DependencyUnavailableError } = require("./errors");

class OrdersService {
    constructor(ordersRepository) {
        this.repo = ordersRepository;
    }

    create(data) {
        const details = [];
        if (!data.clientId) details.push({ field: "clientId", message: "clientId is required" });
        if (!data.masterId) details.push({ field: "masterId", message: "masterId is required" });
        if (!data.serviceId) details.push({ field: "serviceId", message: "serviceId is required" });
        if (!data.scheduledAt) details.push({ field: "scheduledAt", message: "scheduledAt is required" });

        if (details.length > 0) {
            throw new ValidationError("ORDER_INVALID", details);
        }

        let id;
        try {
            id = this.repo.nextId();
        } catch (err) {
            // Storage failures become an explicit degraded-mode error instead of a generic 500.
            throw new DependencyUnavailableError("Orders storage is unavailable", { cause: err.message });
        }
        const order = new Order(id, data.clientId, data.masterId, data.serviceId, data.scheduledAt);
        const now = new Date().toISOString();
        order.createdAt = now;
        order.updatedAt = now;

        try {
            return this.repo.save(order);
        } catch (err) {
            throw new DependencyUnavailableError("Orders storage is unavailable", { cause: err.message });
        }
    }

    list() {
        try {
            return this.repo.findAll();
        } catch (err) {
            throw new DependencyUnavailableError("Orders storage is unavailable", { cause: err.message });
        }
    }

    getById(id) {
        let order;
        try {
            order = this.repo.findById(id);
        } catch (err) {
            throw new DependencyUnavailableError("Orders storage is unavailable", { cause: err.message });
        }
        if (!order) throw new NotFoundError("ORDER_NOT_FOUND");
        return order;
    }

    update(id, data) {
        let order;
        try {
            order = this.repo.findById(id);
        } catch (err) {
            throw new DependencyUnavailableError("Orders storage is unavailable", { cause: err.message });
        }
        if (!order) throw new NotFoundError("ORDER_NOT_FOUND");

        if (data.scheduledAt) {
            order.scheduledAt = data.scheduledAt;
        }

        if (data.status) {
            try {
                if (data.status === "confirmed") order.confirm();
                else if (data.status === "done") order.complete();
                else if (data.status === "cancelled") order.cancel();
                else {
                    throw new ValidationError("INVALID_STATUS", [
                        { field: "status", message: `Unknown status: ${data.status}` },
                    ]);
                }
            } catch (err) {
                if (err instanceof ValidationError) throw err;
                // помилки з доменного класу (напр. неможливий перехід статусу)
                throw new ValidationError("INVALID_TRANSITION", [
                    { field: "status", message: err.message },
                ]);
            }
        }

        order.updatedAt = new Date().toISOString();
        try {
            return this.repo.save(order);
        } catch (err) {
            throw new DependencyUnavailableError("Orders storage is unavailable", { cause: err.message });
        }
    }

    remove(id) {
        let order;
        try {
            order = this.repo.findById(id);
        } catch (err) {
            throw new DependencyUnavailableError("Orders storage is unavailable", { cause: err.message });
        }
        if (!order) throw new NotFoundError("ORDER_NOT_FOUND");
        try {
            this.repo.delete(id);
        } catch (err) {
            throw new DependencyUnavailableError("Orders storage is unavailable", { cause: err.message });
        }
    }
}

module.exports = OrdersService;