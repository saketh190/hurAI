// Simple Gemini LLM test script - using direct API call
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-2.5-flash'; // Fresh model with separate quota

async function testGemini() {
    console.log('='.repeat(50));
    console.log('Gemini LLM Test (Direct API)');
    console.log('='.repeat(50));
    console.log(`API Key: ${API_KEY?.substring(0, 15)}...`);
    console.log(`Model: ${MODEL}`);
    console.log('');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    const body = {
        contents: [{
            parts: [{ text: 'Hello, what is 2+2? Answer briefly.' }]
        }]
    };

    console.log('Sending prompt: "Hello, what is 2+2?"');
    console.log('Using: v1beta API');
    console.log('Waiting for response...\n');

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (data.error) {
            console.log('❌ ERROR!\n');
            console.log('Error:', data.error.message);

            if (data.error.code === 429) {
                console.log('\n💡 Quota exceeded. Wait for reset or try different model.');
            }
            if (data.error.code === 404) {
                console.log('\n💡 Model not found. Try: gemini-2.0-flash or gemini-2.5-flash');
            }
        } else {
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log('✅ SUCCESS!\n');
            console.log('Response:');
            console.log('-'.repeat(30));
            console.log(text);
            console.log('-'.repeat(30));
        }
    } catch (error) {
        console.log('❌ Network Error:', error.message);
    }
}

testGemini();

