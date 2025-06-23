import 'dotenv/config';

export const aiConfig = {
  OLLAMA_URL: process.env.OLLAMA_URL || 'http://localhost:11434',
  OLLAMA_EMBEDDING_MODEL: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
  OLLAMA_CHAT_MODEL: process.env.OLLAMA_CHAT_MODEL || 'tinyllama:1.1b',
}; 