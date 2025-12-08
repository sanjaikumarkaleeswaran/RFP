import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testGeminiAPI() {
    console.log('\n🧪 Testing Gemini API Integration...\n');

    // Check if API key exists
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not found in environment variables');
        console.log('   Please check your .env file');
        process.exit(1);
    }

    console.log('✅ GEMINI_API_KEY found');
    console.log(`   Length: ${apiKey.length} characters`);
    console.log(`   Starts with: ${apiKey.substring(0, 10)}...`);

    // Test API connection
    try {
        console.log('\n🔄 Testing API connection...');

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const result = await model.generateContent('Say "Hello! Gemini API is working!" in a friendly way.');
        const response = result.response.text();

        console.log('\n✅ API Connection Successful!');
        console.log('\n📝 AI Response:');
        console.log('   ' + response);
        console.log('\n🎉 Gemini API is fully integrated and working!\n');

    } catch (error: any) {
        console.error('\n❌ API Connection Failed:');
        console.error('   Error:', error.message);

        if (error.message.includes('API_KEY_INVALID')) {
            console.log('\n💡 Tip: Check if your API key is correct');
            console.log('   Get a new key at: https://aistudio.google.com/app/apikey');
        }

        process.exit(1);
    }
}

testGeminiAPI();
