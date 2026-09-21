const express = require("express");
const { ValidationError, NotFoundError } = require("../service/errors");

function ordersRouter(ordersService) {
    const router = express.Router();

    function toResponse(order) {
        return {
            id: order.id,
            clientId: order.clientId,
            masterId: order.masterId,
            serviceId: order.serviceId,
            scheduledAt: order.scheduledAt,
            status: order.status,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        };
    }

    function handleError(err, res) {
        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.name, code: err.code, details: err.details });
        }
        if (err instanceof NotFoundError) {
            return res.status(404).json({ error: err.name, code: err.code, details: null });
        }
        return res.status(500).json({ error: "InternalError", code: null, details: null });
    }

    router.post("/orders", (req, res) => {
        try {
            const order = ordersService.create(req.body || {});
            res.status(201).json(toResponse(order));
        } catch (err) {
            handleError(err, res);
        }
    });

    router.get("/orders", (req, res) => {
        try {
            const orders = ordersService.list();
            res.status(200).json(orders.map(toResponse));
        } catch (err) {
            handleError(err, res);
        }
    });

    router.get("/orders/:id", (req, res) => {
        try {
            const order = ordersService.getById(req.params.id);
            res.status(200).json(toResponse(order));
        } catch (err) {
            handleError(err, res);
        }
    });

    router.put("/orders/:id", (req, res) => {
        try {
            const order = ordersService.update(req.params.id, req.body || {});
            res.status(200).json(toResponse(order));
        } catch (err) {
            handleError(err, res);
        }
    });

    router.delete("/orders/:id", (req, res) => {
        try {
            ordersService.remove(req.params.id);
            res.status(204).send();
        } catch (err) {
            handleError(err, res);
        }
    });

    return router;
}

module.exports = ordersRouter;