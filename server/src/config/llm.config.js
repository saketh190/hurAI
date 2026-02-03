import dotenv from 'dotenv';
dotenv.config();

/**
 * LLM Configuration
 */
export const llmConfig = {
  // Primary and fallback providers
  primaryProvider: process.env.PRIMARY_LLM || 'openai',
  fallbackProvider: process.env.FALLBACK_LLM || 'gemini',

  // OpenAI settings
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    maxTokens: 1024,
    temperature: 0.7,
  },

  // Gemini settings
  gemini: {
    apiKey: process.env.GOOGLE_API_KEY,
    model: 'gemini-2.5-flash',
    maxTokens: 1024,
    temperature: 0.7,
  },

  // Retry settings
  retry: {
    maxAttempts: 2,
    delayMs: 1000,
  },
};

export default llmConfig;
