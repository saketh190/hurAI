// Quick script to list available Gemini models
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    console.log('Fetching available Gemini models...\n');

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`
        );
        const data = await response.json();

        if (data.error) {
            console.error('API Error:', data.error.message);
            return;
        }

        console.log('Models that support generateContent:\n');
        const models = (data.models || [])
            .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
            .map(m => m.name.replace('models/', ''));

        models.forEach(m => console.log('  ' + m));
        console.log('\nTotal:', models.length, 'models');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

listModels();
