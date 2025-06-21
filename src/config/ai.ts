import 'dotenv/config';

export const aiConfig = {
  OLLAMA_URL: process.env.OLLAMA_URL || 'http://localhost:11434',
}; 