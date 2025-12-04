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
exports.parseProposal = exports.getProposalById = exports.getProposals = exports.createProposal = void 0;
const service_1 = require("./service");
const AppError_1 = require("../../common/utils/AppError");
const createProposal = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const proposal = yield service_1.proposalService.createProposal(req.body);
        res.status(201).json(proposal);
    }
    catch (error) {
        next(error);
    }
});
exports.createProposal = createProposal;
const getProposals = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const proposals = yield service_1.proposalService.getProposals(req.query);
        res.status(200).json(proposals);
    }
    catch (error) {
        next(error);
    }
});
exports.getProposals = getProposals;
const getProposalById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const proposal = yield service_1.proposalService.getProposalById(req.params.id);
        if (!proposal) {
            throw new AppError_1.AppError('Proposal not found', 404);
        }
        res.status(200).json(proposal);
    }
    catch (error) {
        next(error);
    }
});
exports.getProposalById = getProposalById;
const parseProposal = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const proposal = yield service_1.proposalService.parseProposal(req.params.id);
        if (!proposal) {
            throw new AppError_1.AppError('Proposal not found', 404);
        }
        res.status(200).json(proposal);
    }
    catch (error) {
        next(error);
    }
});
exports.parseProposal = parseProposal;
