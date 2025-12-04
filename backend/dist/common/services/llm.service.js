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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmService = exports.LLMService = void 0;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
class LLMService {
    constructor() {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.warn('GROQ_API_KEY is not set. LLM features may not work.');
        }
        this.groq = new groq_sdk_1.default({ apiKey });
        // Using Llama 3.1 70B as requested (fastest & free on Groq)
        this.defaultModel = 'llama-3.1-70b-versatile';
    }
    /**
     * Generate text completion
     */
    generateText(prompt_1, model_1) {
        return __awaiter(this, arguments, void 0, function* (prompt, model, maxTokens = 1024) {
            var _a, _b;
            try {
                const completion = yield this.groq.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: model || this.defaultModel,
                    max_tokens: maxTokens,
                    temperature: 0.7,
                });
                return ((_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || '';
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
            var _a, _b;
            const jsonPrompt = `${prompt}\n\nRespond strictly with valid JSON only. Do not include markdown formatting, code blocks, or explanations. Just the raw JSON string.`;
            try {
                const completion = yield this.groq.chat.completions.create({
                    messages: [{ role: 'user', content: jsonPrompt }],
                    model: model || this.defaultModel,
                    response_format: { type: 'json_object' }, // Groq supports native JSON mode
                    temperature: 0.1, // Lower temperature for more deterministic output
                });
                const text = ((_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || '{}';
                return JSON.parse(text);
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
