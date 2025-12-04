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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = exports.signToken = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const model_1 = require("../user/model");
const AppError_1 = require("../../common/utils/AppError");
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const signToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
};
exports.signToken = signToken;
const register = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const existingUser = yield model_1.User.findOne({ email: input.email });
    if (existingUser) {
        throw new AppError_1.AppError('Email already in use', 409);
    }
    const salt = yield bcryptjs_1.default.genSalt(10);
    const passwordHash = yield bcryptjs_1.default.hash(input.password, salt);
    const user = yield model_1.User.create({
        email: input.email,
        passwordHash,
        name: input.name,
    });
    const token = (0, exports.signToken)(user._id.toString());
    // Return user without passwordHash
    const userObject = user.toObject();
    const { passwordHash: _ } = userObject, userWithoutPassword = __rest(userObject, ["passwordHash"]);
    return { user: userWithoutPassword, token };
});
exports.register = register;
const login = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield model_1.User.findOne({ email: input.email });
    if (!user || !(yield bcryptjs_1.default.compare(input.password, user.passwordHash))) {
        throw new AppError_1.AppError('Invalid email or password', 401);
    }
    const token = (0, exports.signToken)(user._id.toString());
    const userObject = user.toObject();
    const { passwordHash: _ } = userObject, userWithoutPassword = __rest(userObject, ["passwordHash"]);
    return { user: userWithoutPassword, token };
});
exports.login = login;
const getMe = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield model_1.User.findById(userId).select('-passwordHash');
    if (!user) {
        throw new AppError_1.AppError('User not found', 404);
    }
    return user;
});
exports.getMe = getMe;
