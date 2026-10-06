const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const app = require("../server");
const { requestWithRetry } = require("../service/dependency-client");
const { rateLimit } = require("../api/middleware");

function request(method, path, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const server = app.listen(0, () => {
            const port = server.address().port;
            const req = http.request({
                port, method, path,
                headers: { "Content-Type": "application/json", ...headers },
            }, (res) => {
                let data = "";
                res.on("data", (chunk) => { data += chunk; });
                res.on("end", () => {
                    server.close();
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: data ? JSON.parse(data) : null,
                    });
                });
            });
            req.on("error", (err) => { server.close(); reject(err); });
            if (body !== undefined) req.write(JSON.stringify(body));
            req.end();
        });
    });
}

test("health is available and request id is returned", async () => {
    const response = await request("GET", "/health");
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: "ok" });
    assert.ok(response.headers["x-request-id"]);
});

test("POST requires Idempotency-Key and replays the same result", async () => {
    const data = {
        clientId: "test-client",
        masterId: "test-master",
        serviceId: "test-service",
        scheduledAt: "2026-09-20T10:00:00Z",
    };
    const missing = await request("POST", "/orders", data);
    assert.equal(missing.status, 400);
    assert.equal(missing.body.code, "IDEMPOTENCY_KEY_REQUIRED");

    const first = await request("POST", "/orders", data, { "Idempotency-Key": "test-idempotency-key" });
    const replay = await request("POST", "/orders", { ...data }, { "Idempotency-Key": "test-idempotency-key" });
    assert.equal(first.status, 201);
    assert.equal(first.body.requestId, first.headers["x-request-id"]);
    assert.deepEqual(replay.body, first.body);
});

test("DELETE invalidates the cached idempotency response for the deleted order", async () => {
    const data = {
        clientId: "delete-client",
        masterId: "delete-master",
        serviceId: "delete-service",
        scheduledAt: "2026-09-21T10:00:00Z",
    };
    const headers = { "Idempotency-Key": "delete-recreate-key" };
    const first = await request("POST", "/orders", data, headers);
    assert.equal(first.status, 201);

    const deleted = await request("DELETE", `/orders/${first.body.id}`);
    assert.equal(deleted.status, 204);

    const recreated = await request("POST", "/orders", data, headers);
    assert.equal(recreated.status, 201);
    assert.notEqual(recreated.body.id, first.body.id);

    const listed = await request("GET", "/orders");
    assert.ok(listed.body.some((order) => order.id === recreated.body.id));
});

test("dependency helper aborts slow requests and retries", async () => {
    let attempts = 0;
    await assert.rejects(
        requestWithRetry(async ({ signal }) => {
            attempts += 1;
            await new Promise((resolve, reject) => {
                signal.addEventListener("abort", () => reject(new Error("aborted")));
            });
        }, { timeoutMs: 5, retries: 2, baseDelayMs: 1 }),
        /aborted/
    );
    assert.equal(attempts, 3);
});

test("rate limiter returns 429 and Retry-After", () => {
    const middleware = rateLimit({ limit: 1, windowMs: 10_000 });
    const req = { ip: "test-rate-limit", requestId: "req-rate-limit" };
    let nextCalls = 0;
    const response = {
        headers: {},
        set(name, value) { this.headers[name] = value; },
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; },
    };

    middleware(req, response, () => { nextCalls += 1; });
    middleware(req, response, () => { nextCalls += 1; });

    assert.equal(nextCalls, 1);
    assert.equal(response.statusCode, 429);
    assert.ok(Number(response.headers["Retry-After"]) >= 1);
    assert.equal(response.body.requestId, req.requestId);
});
