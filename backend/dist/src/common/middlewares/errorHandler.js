"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const AppError_1 = require("../utils/AppError");
const zod_1 = require("zod");
const errorHandler = (err, req, res, next) => {
    let error = err;
    if (err instanceof zod_1.ZodError) {
        const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        error = new AppError_1.AppError(message, 400);
    }
    if (error instanceof AppError_1.AppError) {
        return res.status(error.statusCode).json({
            status: error.status,
            message: error.message,
        });
    }
    console.error('ERROR 💥', error);
    return res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!',
    });
};
exports.errorHandler = errorHandler;
