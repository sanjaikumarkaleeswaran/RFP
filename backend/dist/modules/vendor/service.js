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
exports.vendorService = exports.VendorService = void 0;
const model_1 = require("./model");
class VendorService {
    createVendor(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const vendor = new model_1.Vendor(data);
            return yield vendor.save();
        });
    }
    getVendors() {
        return __awaiter(this, arguments, void 0, function* (filter = {}) {
            return yield model_1.Vendor.find(filter).sort({ createdAt: -1 });
        });
    }
    getVendorById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield model_1.Vendor.findById(id);
        });
    }
    updateVendor(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield model_1.Vendor.findByIdAndUpdate(id, data, { new: true });
        });
    }
    deleteVendor(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield model_1.Vendor.findByIdAndDelete(id);
        });
    }
}
exports.VendorService = VendorService;
exports.vendorService = new VendorService();
