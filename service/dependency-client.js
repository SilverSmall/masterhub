function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestWithRetry(request, {
    timeoutMs = 2_000,
    retries = 2,
    baseDelayMs = 100,
} = {}) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            return await request({ signal: controller.signal, attempt });
        } catch (err) {
            lastError = err;
            if (attempt === retries) throw err;
            await delay(baseDelayMs * (2 ** attempt));
        } finally {
            clearTimeout(timer);
        }
    }
    throw lastError;
}

module.exports = { requestWithRetry };
