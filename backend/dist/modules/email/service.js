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
exports.emailService = exports.EmailService = void 0;
const model_1 = require("./model");
class EmailService {
    createEmail(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const email = new model_1.Email(data);
            return yield email.save();
        });
    }
    getEmails() {
        return __awaiter(this, arguments, void 0, function* (filter = {}) {
            return yield model_1.Email.find(filter).sort({ receivedAt: -1, createdAt: -1 });
        });
    }
    getEmailById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield model_1.Email.findById(id);
        });
    }
    attachToSpace(emailId, spaceId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield model_1.Email.findByIdAndUpdate(emailId, { spaceId }, { new: true });
        });
    }
}
exports.EmailService = EmailService;
exports.emailService = new EmailService();
