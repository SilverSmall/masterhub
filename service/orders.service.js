
const Order = require("../domain/booking/Order");
const { ValidationError, NotFoundError } = require("./errors");

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

        const id = this.repo.nextId();
        const order = new Order(id, data.clientId, data.masterId, data.serviceId, data.scheduledAt);
        const now = new Date().toISOString();
        order.createdAt = now;
        order.updatedAt = now;

        return this.repo.save(order);
    }

    list() {
        return this.repo.findAll();
    }

    getById(id) {
        const order = this.repo.findById(id);
        if (!order) throw new NotFoundError("ORDER_NOT_FOUND");
        return order;
    }

    update(id, data) {
        const order = this.repo.findById(id);
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
        return this.repo.save(order);
    }

    remove(id) {
        const order = this.repo.findById(id);
        if (!order) throw new NotFoundError("ORDER_NOT_FOUND");
        this.repo.delete(id);
    }
}

module.exports = OrdersService;