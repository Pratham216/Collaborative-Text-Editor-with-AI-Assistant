const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGeminiAPI() {
    console.log('Testing Gemini API configuration...');
    console.log('API Key length:', process.env.GEMINI_API_KEY?.length || 'not set');
    
    try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelName = process.env.GEMINI_MODEL || 'models/gemini-2.5-pro';
    const model = genAI.getGenerativeModel({ model: modelName });
        
        console.log('Model initialized successfully, testing with a simple prompt...');
        
    const result = await model.generateContent('Say hello in one word.');
        const response = await result.response;
        const text = response.text();
        
        console.log('Success! API is working.');
        console.log('Response:', text);
        return true;
    } catch (error) {
        console.error('Error testing Gemini API:');
        console.error('Message:', error.message);
        if (error.message.includes('API key')) {
            console.log('\nTIP: Make sure your .env file contains the correct API key');
            console.log('It should look like: GEMINI_API_KEY=your-key-here');
        }
        return false;
    }
}

// Run the test
testGeminiAPI().then(success => {
    if (!success) {
        process.exit(1);
    }
});