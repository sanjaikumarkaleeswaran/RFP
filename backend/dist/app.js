"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const errorHandler_1 = require("./common/middlewares/errorHandler");
// Routes
const routes_1 = __importDefault(require("./modules/auth/routes"));
const routes_2 = __importDefault(require("./modules/space/routes"));
const routes_3 = __importDefault(require("./modules/vendor/routes"));
const routes_4 = __importDefault(require("./modules/email/routes"));
const routes_5 = __importDefault(require("./modules/proposal/routes"));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Routes
app.use('/api/auth', routes_1.default);
app.use('/api/spaces', routes_2.default);
app.use('/api/vendors', routes_3.default);
app.use('/api/emails', routes_4.default);
app.use('/api/proposals', routes_5.default);
// Error Handler
app.use(errorHandler_1.errorHandler);
exports.default = app;
