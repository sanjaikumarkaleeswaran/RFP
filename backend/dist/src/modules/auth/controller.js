"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMeHandler = exports.logoutHandler = exports.loginHandler = exports.registerHandler = void 0;
const catchAsync_1 = require("../../common/utils/catchAsync");
const service_1 = require("./service");
exports.registerHandler = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user, token } = yield (0, service_1.register)(req.body);
    res.status(201).json({
        status: 'success',
        token,
        data: { user },
    });
}));
exports.loginHandler = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user, token } = yield (0, service_1.login)(req.body);
    res.status(200).json({
        status: 'success',
        token,
        data: { user },
    });
}));
const logoutHandler = (req, res) => {
    // Since we are using JWTs, the client just needs to delete the token.
    // We can't really invalidate it server-side without a blacklist/redis.
    // For now, just send a success response.
    res.status(200).json({
        status: 'success',
        message: 'Logged out successfully',
    });
};
exports.logoutHandler = logoutHandler;
exports.getMeHandler = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // req.user is set by authenticate middleware
    if (!req.user) {
        throw new Error('User not found in request');
    }
    const user = yield (0, service_1.getMe)(req.user.id);
    res.status(200).json({
        status: 'success',
        data: { user },
    });
}));
