require('dotenv').config();
const https = require('https');

async function listModels() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not set in environment. Set it in .env or the shell and retry.');
    process.exit(1);
  }

  const apiKey = encodeURIComponent(process.env.GEMINI_API_KEY);
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

  console.log('Calling Google Generative Language models list endpoint...');

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body || '{}');
          if (res.statusCode && res.statusCode >= 400) {
            console.error('API returned error', res.statusCode, parsed);
            return reject(new Error(`API returned status ${res.statusCode}`));
          }
          console.log(JSON.stringify(parsed, null, 2));
          resolve(parsed);
        } catch (err) {
          console.error('Failed to parse response from models list API:', err.message);
          reject(err);
        }
      });
    }).on('error', (err) => {
      console.error('Request error while listing models:', err.message);
      reject(err);
    });
  });
}

listModels().catch(() => process.exit(1));
