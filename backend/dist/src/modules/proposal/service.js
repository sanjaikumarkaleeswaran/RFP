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
exports.proposalService = exports.ProposalService = void 0;
const model_1 = require("./model");
const llm_service_1 = require("../../common/services/llm.service");
class ProposalService {
    createProposal(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const proposal = new model_1.Proposal(data);
            return yield proposal.save();
        });
    }
    getProposals() {
        return __awaiter(this, arguments, void 0, function* (filter = {}) {
            return yield model_1.Proposal.find(filter).sort({ createdAt: -1 });
        });
    }
    getProposalById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield model_1.Proposal.findById(id);
        });
    }
    updateProposal(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield model_1.Proposal.findByIdAndUpdate(id, data, { new: true });
        });
    }
    /**
     * Parse proposal from raw text using LLM
     */
    parseProposal(proposalId) {
        return __awaiter(this, void 0, void 0, function* () {
            const proposal = yield model_1.Proposal.findById(proposalId);
            if (!proposal)
                return null;
            const prompt = `
      Extract the following fields from the vendor proposal text below into a JSON object:
      - prices: array of objects with { item, price (number), currency }
      - terms: string (payment terms)
      - delivery: string (delivery timeline)
      - validity: string (quote validity)
      - completenessScore: number (0-100 based on presence of price, terms, delivery)

      Proposal Text:
      "${proposal.rawText}"
    `;
            try {
                const extractedData = yield llm_service_1.llmService.generateJson(prompt);
                proposal.extracted = extractedData;
                proposal.status = 'parsed';
                yield proposal.save();
                return proposal;
            }
            catch (error) {
                console.error('Failed to parse proposal:', error);
                throw error;
            }
        });
    }
}
exports.ProposalService = ProposalService;
exports.proposalService = new ProposalService();
