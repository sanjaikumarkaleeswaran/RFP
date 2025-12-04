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
exports.generateTemplate = exports.parseRequirements = exports.deleteSpace = exports.updateSpace = exports.getSpaceById = exports.getSpaces = exports.createSpace = void 0;
const service_1 = require("./service");
const AppError_1 = require("../../common/utils/AppError");
const createSpace = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // TODO: Attach ownerId from authenticated user
        // req.body.ownerId = req.user._id; 
        const space = yield service_1.spaceService.createSpace(req.body);
        res.status(201).json(space);
    }
    catch (error) {
        next(error);
    }
});
exports.createSpace = createSpace;
const getSpaces = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // TODO: Filter by ownerId
        const spaces = yield service_1.spaceService.getSpaces(req.query);
        res.status(200).json(spaces);
    }
    catch (error) {
        next(error);
    }
});
exports.getSpaces = getSpaces;
const getSpaceById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const space = yield service_1.spaceService.getSpaceById(req.params.id);
        if (!space) {
            throw new AppError_1.AppError('Space not found', 404);
        }
        res.status(200).json(space);
    }
    catch (error) {
        next(error);
    }
});
exports.getSpaceById = getSpaceById;
const updateSpace = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const space = yield service_1.spaceService.updateSpace(req.params.id, req.body);
        if (!space) {
            throw new AppError_1.AppError('Space not found', 404);
        }
        res.status(200).json(space);
    }
    catch (error) {
        next(error);
    }
});
exports.updateSpace = updateSpace;
const deleteSpace = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const space = yield service_1.spaceService.deleteSpace(req.params.id);
        if (!space) {
            throw new AppError_1.AppError('Space not found', 404);
        }
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
exports.deleteSpace = deleteSpace;
const parseRequirements = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { rawRequirements } = req.body;
        const space = yield service_1.spaceService.parseRequirements(req.params.id, rawRequirements);
        if (!space) {
            throw new AppError_1.AppError('Space not found', 404);
        }
        res.status(200).json(space);
    }
    catch (error) {
        next(error);
    }
});
exports.parseRequirements = parseRequirements;
const generateTemplate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const space = yield service_1.spaceService.generateTemplate(req.params.id);
        if (!space) {
            throw new AppError_1.AppError('Space not found', 404);
        }
        res.status(200).json(space);
    }
    catch (error) {
        next(error);
    }
});
exports.generateTemplate = generateTemplate;
