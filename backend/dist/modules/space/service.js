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
exports.spaceService = exports.SpaceService = void 0;
const model_1 = require("./model");
const llm_service_1 = require("../../common/services/llm.service");
class SpaceService {
    createSpace(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const space = new model_1.Space(data);
            return yield space.save();
        });
    }
    getSpaces() {
        return __awaiter(this, arguments, void 0, function* (filter = {}) {
            return yield model_1.Space.find(filter).sort({ createdAt: -1 });
        });
    }
    getSpaceById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield model_1.Space.findById(id);
        });
    }
    updateSpace(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield model_1.Space.findByIdAndUpdate(id, data, { new: true });
        });
    }
    deleteSpace(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield model_1.Space.findByIdAndDelete(id);
        });
    }
    /**
     * Parse raw requirements using LLM
     */
    parseRequirements(spaceId, rawRequirements) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Update space with raw requirements
            const space = yield model_1.Space.findByIdAndUpdate(spaceId, { requirements: rawRequirements }, { new: true });
            if (!space)
                return null;
            // 2. Call LLM to parse
            const prompt = `
      Extract the following fields from the requirement text below into a JSON object:
      - items: array of objects with { name, quantity, specs }
      - deliveryDate: string or null
      - warranty: string or null
      - budget: string or null
      - otherRequirements: string or null

      Requirement Text:
      "${rawRequirements}"
    `;
            try {
                const structuredData = yield llm_service_1.llmService.generateJson(prompt);
                // 3. Save structured data
                space.structuredData = structuredData;
                yield space.save();
                return space;
            }
            catch (error) {
                console.error('Failed to parse requirements:', error);
                throw error;
            }
        });
    }
    /**
     * Generate email template using LLM based on structured data
     */
    generateTemplate(spaceId) {
        return __awaiter(this, void 0, void 0, function* () {
            const space = yield model_1.Space.findById(spaceId);
            if (!space || !space.structuredData) {
                throw new Error('Space not found or no structured data available');
            }
            const prompt = `
      Create a professional RFP email template for vendors based on these requirements:
      ${JSON.stringify(space.structuredData)}

      Use placeholders like {{vendor_name}}, {{company_name}} for dynamic values.
      Return ONLY the email body text.
    `;
            try {
                const template = yield llm_service_1.llmService.generateText(prompt);
                space.emailTemplate = template;
                yield space.save();
                return space;
            }
            catch (error) {
                console.error('Failed to generate template:', error);
                throw error;
            }
        });
    }
}
exports.SpaceService = SpaceService;
exports.spaceService = new SpaceService();
