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
exports.attachToSpace = exports.getEmailById = exports.getEmails = exports.importEmail = void 0;
const service_1 = require("./service");
const AppError_1 = require("../../common/utils/AppError");
const importEmail = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // TODO: Handle file uploads for attachments if needed
        // req.body.userId = req.user._id;
        const email = yield service_1.emailService.createEmail(req.body);
        res.status(201).json(email);
    }
    catch (error) {
        next(error);
    }
});
exports.importEmail = importEmail;
const getEmails = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const emails = yield service_1.emailService.getEmails(req.query);
        res.status(200).json(emails);
    }
    catch (error) {
        next(error);
    }
});
exports.getEmails = getEmails;
const getEmailById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = yield service_1.emailService.getEmailById(req.params.id);
        if (!email) {
            throw new AppError_1.AppError('Email not found', 404);
        }
        res.status(200).json(email);
    }
    catch (error) {
        next(error);
    }
});
exports.getEmailById = getEmailById;
const attachToSpace = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { spaceId } = req.body;
        const email = yield service_1.emailService.attachToSpace(req.params.id, spaceId);
        if (!email) {
            throw new AppError_1.AppError('Email not found', 404);
        }
        res.status(200).json(email);
    }
    catch (error) {
        next(error);
    }
});
exports.attachToSpace = attachToSpace;
