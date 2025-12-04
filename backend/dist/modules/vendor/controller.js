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
exports.deleteVendor = exports.updateVendor = exports.getVendorById = exports.getVendors = exports.createVendor = void 0;
const service_1 = require("./service");
const AppError_1 = require("../../common/utils/AppError");
const createVendor = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vendor = yield service_1.vendorService.createVendor(req.body);
        res.status(201).json(vendor);
    }
    catch (error) {
        next(error);
    }
});
exports.createVendor = createVendor;
const getVendors = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vendors = yield service_1.vendorService.getVendors(req.query);
        res.status(200).json(vendors);
    }
    catch (error) {
        next(error);
    }
});
exports.getVendors = getVendors;
const getVendorById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vendor = yield service_1.vendorService.getVendorById(req.params.id);
        if (!vendor) {
            throw new AppError_1.AppError('Vendor not found', 404);
        }
        res.status(200).json(vendor);
    }
    catch (error) {
        next(error);
    }
});
exports.getVendorById = getVendorById;
const updateVendor = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vendor = yield service_1.vendorService.updateVendor(req.params.id, req.body);
        if (!vendor) {
            throw new AppError_1.AppError('Vendor not found', 404);
        }
        res.status(200).json(vendor);
    }
    catch (error) {
        next(error);
    }
});
exports.updateVendor = updateVendor;
const deleteVendor = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vendor = yield service_1.vendorService.deleteVendor(req.params.id);
        if (!vendor) {
            throw new AppError_1.AppError('Vendor not found', 404);
        }
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
exports.deleteVendor = deleteVendor;
