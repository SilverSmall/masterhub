
class ValidationError extends Error {
    constructor(code, details) {
        super("ValidationError");
        this.name = "ValidationError";
        this.code = code;
        this.details = details;
    }
}

class NotFoundError extends Error {
    constructor(code) {
        super("NotFoundError");
        this.name = "NotFoundError";
        this.code = code;
    }
}

module.exports = { ValidationError, NotFoundError };