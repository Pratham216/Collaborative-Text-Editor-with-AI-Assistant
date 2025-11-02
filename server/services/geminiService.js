const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
  // Default to a model that is available in your project; allow override via GEMINI_MODEL
  // Use a fully qualified model name that supports generateContent (checked via listModels)
  this.modelName = process.env.GEMINI_MODEL || 'models/gemini-2.5-pro';

    // Basic credentials check. The Google client can use Application Default Credentials
    // (set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON), or an API key.
    // For backwards compatibility, if the project provides GEMINI_API_KEY we copy it to
    // GOOGLE_API_KEY so the client can pick it up.
    if (process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
      process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
    }

    if (!process.env.GOOGLE_API_KEY && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.warn('Warning: GOOGLE_API_KEY or GOOGLE_APPLICATION_CREDENTIALS not set. AI features will not work.');
      this.client = null;
      return;
    }

    try {
      if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
        console.error('No API key provided. Set GEMINI_API_KEY or GOOGLE_API_KEY environment variable.');
        this.client = null;
        return;
      }
      // Initialize with API key
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
      // Get the model (always use gemini-pro for v0.2.1)
      this.client = genAI.getGenerativeModel({ model: this.modelName });
    } catch (error) {
      console.error('Error initializing Generative AI client:', error);
      this.client = null;
    }
  }

  // Generate a response using the configured model. Uses a flexible parsing strategy because
  // the SDK can return different shapes depending on version.
  async generateResponse(prompt, maxTokens = 1000) {
    if (!this.client) {
      console.error('Gemini client not initialized. Check your API key.');
      throw new Error('Gemini API not configured');
    }

    try {
      console.log('Generating content with model:', this.modelName);
      const result = await this.client.generateContent(prompt);
      
      if (!result) {
        throw new Error('No response from Gemini API');
      }

      const response = await result.response;
      if (!response) {
        throw new Error('Invalid response from Gemini API');
      }

      const text = response.text();
      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      return text;
    } catch (error) {
      // Log the full error for debugging
      console.error('Gemini API error details:', {
        error: error.message,
        stack: error.stack,
        model: this.modelName,
        promptLength: prompt.length
      });
      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  }

  async checkGrammar(text) {
    const prompt = `Please check the grammar and style of the following text. Provide corrections and suggestions in a clear format. Only respond with corrections, not explanations:\n\n${text}`;
    return await this.generateResponse(prompt, 500);
  }

  async enhanceText(text) {
    const prompt = `Please enhance the following text to improve clarity, tone, and readability. Provide the enhanced version:\n\n${text}`;
    return await this.generateResponse(prompt, 1000);
  }

  async summarizeText(text) {
    const prompt = `Please provide a concise summary of the following text:\n\n${text}`;
    return await this.generateResponse(prompt, 300);
  }

  async completeText(text, context = '') {
    const prompt = `Given the context: "${context}", please provide a natural continuation or completion for: "${text}"\n\nProvide only the completion, not explanations:`;
    return await this.generateResponse(prompt, 200);
  }

  async getSuggestions(text, context = '') {
    const prompt = `Based on the following text: "${text}"${context ? ` and context: "${context}"` : ''}, provide 3-5 writing suggestions to improve the content. Format as a numbered list:`;
    return await this.generateResponse(prompt, 500);
  }
}

module.exports = new GeminiService();

