import Groq from 'groq-sdk';

export class LLMService {
    private groq: Groq | null;
    private defaultModel: string;
    private isEnabled: boolean;

    constructor() {
        const apiKey = process.env.GROQ_API_KEY;
        this.isEnabled = !!apiKey;

        if (!apiKey) {
            console.warn('⚠️  GROQ_API_KEY is not set. AI parsing features will be disabled.');
            this.groq = null;
        } else {
            console.log('✅ GROQ_API_KEY loaded successfully (length:', apiKey.length, ')');
            this.groq = new Groq({ apiKey });
        }

        // Using Llama 3.3 70B (latest version, fastest & free on Groq)
        this.defaultModel = 'llama-3.3-70b-versatile';
    }

    /**
     * Generate text completion
     */
    async generateText(prompt: string, model?: string, maxTokens: number = 1024): Promise<string> {
        if (!this.isEnabled || !this.groq) {
            console.warn('LLM service is not enabled. Returning empty response.');
            return '';
        }

        try {
            const completion = await this.groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: model || this.defaultModel,
                max_tokens: maxTokens,
                temperature: 0.7,
            });

            return completion.choices[0]?.message?.content || '';
        } catch (error) {
            console.error('LLM Text Generation Error:', error);
            throw new Error('Failed to generate text from LLM');
        }
    }

    /**
     * Generate structured JSON output
     * Useful for extraction and parsing
     */
    async generateJson<T>(prompt: string, model?: string): Promise<T> {
        if (!this.isEnabled || !this.groq) {
            console.warn('LLM service is not enabled. Returning empty object.');
            return {} as T;
        }

        const jsonPrompt = `${prompt}\n\nRespond strictly with valid JSON only. Do not include markdown formatting, code blocks, or explanations. Just the raw JSON string.`;

        try {
            const completion = await this.groq.chat.completions.create({
                messages: [{ role: 'user', content: jsonPrompt }],
                model: model || this.defaultModel,
                response_format: { type: 'json_object' }, // Groq supports native JSON mode
                temperature: 0.1, // Lower temperature for more deterministic output
            });

            const text = completion.choices[0]?.message?.content || '{}';
            return JSON.parse(text) as T;
        } catch (error) {
            console.error('LLM JSON Generation Error:', error);
            throw new Error('Failed to generate JSON from LLM');
        }
    }
}

export const llmService = new LLMService();
