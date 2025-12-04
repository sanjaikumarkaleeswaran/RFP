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
exports.llmService = exports.LLMService = void 0;
const inference_1 = require("@huggingface/inference");
class LLMService {
    constructor() {
        const apiKey = process.env.HF_API_KEY;
        if (!apiKey) {
            console.warn('HF_API_KEY is not set. LLM features may not work.');
        }
        this.hf = new inference_1.HfInference(apiKey);
        // Default to Qwen 2.5 72B Instruct as requested for JSON/Mapping
        this.defaultModel = 'Qwen/Qwen2.5-72B-Instruct';
    }
    /**
     * Generate text completion
     */
    generateText(prompt_1, model_1) {
        return __awaiter(this, arguments, void 0, function* (prompt, model, maxTokens = 1024) {
            try {
                const result = yield this.hf.textGeneration({
                    model: model || this.defaultModel,
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: maxTokens,
                        return_full_text: false,
                    },
                });
                return result.generated_text;
            }
            catch (error) {
                console.error('LLM Text Generation Error:', error);
                throw new Error('Failed to generate text from LLM');
            }
        });
    }
    /**
     * Generate structured JSON output
     * Useful for extraction and parsing
     */
    generateJson(prompt, model) {
        return __awaiter(this, void 0, void 0, function* () {
            const jsonPrompt = `${prompt}\n\nRespond strictly with valid JSON only. Do not include markdown formatting or explanations.`;
            try {
                const text = yield this.generateText(jsonPrompt, model);
                // Attempt to clean markdown code blocks if present
                const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(cleanedText);
            }
            catch (error) {
                console.error('LLM JSON Generation Error:', error);
                throw new Error('Failed to generate JSON from LLM');
            }
        });
    }
}
exports.LLMService = LLMService;
exports.llmService = new LLMService();
