import { Request, Response } from 'express';
import { HfInference } from '@huggingface/inference';

/**
 * Test Mistral 3 API connection
 */
export const testGeminiConnection = async (req: Request, res: Response) => {
    try {
        const apiKey = process.env.HUGGINGFACE_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                success: false,
                error: 'HUGGINGFACE_API_KEY not found in environment variables',
                message: 'Please add HUGGINGFACE_API_KEY to your .env file'
            });
        }

        console.log('🧪 Testing Mistral 3 API connection...');
        console.log('   API Key length:', apiKey.length);
        console.log('   API Key prefix:', apiKey.substring(0, 10) + '...');

        // Test API connection with Mistral 3
        const hf = new HfInference(apiKey);

        const result = await hf.chatCompletion({
            model: 'mistralai/Mistral-7B-Instruct-v0.3',
            messages: [
                {
                    role: 'user',
                    content: 'Respond with exactly: "Mistral 3 API is working perfectly!"'
                }
            ],
            max_tokens: 100,
            temperature: 0.7
        });

        const response = result.choices[0]?.message?.content || 'No response';

        console.log('✅ Mistral 3 API test successful!');
        console.log('   Response:', response);

        res.json({
            success: true,
            message: 'Mistral 3 API is connected and working!',
            apiKeyConfigured: true,
            apiKeyLength: apiKey.length,
            testResponse: response,
            model: 'mistralai/Mistral-7B-Instruct-v0.3',
            provider: 'Hugging Face',
            sdk: '@huggingface/inference'
        });

    } catch (error: any) {
        console.error('❌ Mistral 3 API test failed:', error.message);

        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Mistral 3 API connection failed',
            troubleshooting: {
                checkApiKey: 'Verify HUGGINGFACE_API_KEY in .env file',
                getNewKey: 'https://huggingface.co/settings/tokens',
                restartServer: 'Restart backend after adding API key'
            }
        });
    }
};

/**
 * Get Mistral 3 API status
 */
export const getGeminiStatus = async (req: Request, res: Response) => {
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    res.json({
        configured: !!apiKey,
        apiKeyLength: apiKey ? apiKey.length : 0,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'Not set',
        model: 'mistralai/Mistral-7B-Instruct-v0.3',
        provider: 'Hugging Face',
        sdk: '@huggingface/inference',
        features: [
            'Vendor proposal analysis',
            'Text analysis',
            'Proposal comparison',
            'AI recommendations',
            'Chat-based interactions'
        ]
    });
};
