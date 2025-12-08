require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    console.log('\n🧪 Testing Gemini API Integration...\n');

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not found');
        return;
    }

    console.log('✅ API Key found:', apiKey.substring(0, 15) + '...');
    console.log('   Length:', apiKey.length, 'characters\n');

    try {
        console.log('🔄 Testing connection to Gemini API...\n');

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const result = await model.generateContent('Respond with exactly: "Gemini API is working perfectly!"');
        const response = result.response.text();

        console.log('✅ SUCCESS! API is working!\n');
        console.log('📝 AI Response:', response);
        console.log('\n🎉 Your vendor proposal system is now AI-powered!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n💡 Check: https://aistudio.google.com/app/apikey\n');
    }
}

testGemini().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
