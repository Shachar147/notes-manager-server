import { NoteEmbeddingService } from './notes.embedding.service';
import { Note } from './notes.entity';
import { Repository, In } from 'typeorm';
import axios from 'axios';
import { aiConfig } from '../../config/ai';
import logger from '../../utils/logger';

interface OllamaEmbeddingResponse {
  embedding: number[];
}

interface OllamaGenerateResponse {
  response: string;
  // Add other fields from the response if needed
}

export class NotesChatService {
  private readonly embeddingService: NoteEmbeddingService;
  private readonly noteRepo: Repository<Note>;

  constructor(embeddingService: NoteEmbeddingService, noteRepo: Repository<Note>) {
    this.embeddingService = embeddingService;
    this.noteRepo = noteRepo;
  }

  // Compute cosine similarity between two vectors
  cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dot / (normA * normB);
  }

  async findRelevantNotes(question: string, topK = 3): Promise<Note[]> {
    console.log('Starting to find relevant notes...');
    logger.info('Starting to find relevant notes...');
    
    const questionEmbedding = await this.embeddingService.generateEmbedding(question);
    console.log('Generated question embedding');
    logger.info('Generated question embedding');
    
    const allEmbeddings = await this.embeddingService.findAll();
    console.log(`Found ${allEmbeddings.length} embeddings`);
    logger.info(`Found ${allEmbeddings.length} embeddings`);
    
    const similarities = allEmbeddings.map(e => ({
      noteId: e.noteId,
      score: this.cosineSimilarity(questionEmbedding, e.embedding),
    }));
    similarities.sort((a, b) => b.score - a.score);
    const topNoteIds = similarities.slice(0, topK).map(s => s.noteId);
    console.log(`Top note IDs: ${topNoteIds.join(', ')}`);
    logger.info(`Top note IDs: ${topNoteIds.join(', ')}`);
    
    const notes = await this.noteRepo.find({
      where: {
        id: In(topNoteIds),
      },
    });
    console.log(`Found ${notes.length} notes`);
    logger.info(`Found ${notes.length} notes`);
    
    return notes;
  }

  async generateChatResponse(question: string, notes: Note[]): Promise<string> {
    // todo complete: find a better way to handle this, since it may affect AI response if it's cut off in the middle.
    // todo complete2: let AI guide to the exact article it used for the answer.
    
    const CONTEXT_MAX_LENGTH = 1000; // Max characters per note to send to the model
    
    if (notes.length === 0) {
      return "I don't have any relevant information to answer your question.";
    }

    const context = notes
      .map(n => `Title: ${n.title}\nContent: ${n.content.substring(0, CONTEXT_MAX_LENGTH)}`)
      .join('\n\n---\n\n');
    
    const prompt = `You are a helpful assistant. Answer the user's question based on the provided knowledge base. If the knowledge base doesn't contain relevant information, say "I don't have information about that in my knowledge base."

Knowledge Base:
${context}

Question: ${question}

Answer:`;

    console.log(`trying to generate chat response for ${question}`);
    logger.info(`trying to generate chat response for ${question}`);
    
    // Debug: Log the prompt being sent to the model
    console.log('=== PROMPT BEING SENT TO MODEL ===');
    console.log(prompt);
    console.log('=== END PROMPT ===');

    try {
      console.log('About to call Ollama API...');
      logger.info('About to call Ollama API...');
      
      const response = await axios.post<OllamaGenerateResponse>(`${aiConfig.OLLAMA_URL}/api/generate`, {
        model: aiConfig.OLLAMA_CHAT_MODEL,
        prompt,
        stream: false,
      }, {
        timeout: 180000, // 3 minutes timeout
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log("response received!");
      logger.info("response received!");

      return response.data.response;
    } catch (error: any) {
      console.error('Error calling Ollama API:', error);
      logger.error('Error calling Ollama API:', error);
      
      if (error.code === 'ECONNABORTED') {
        return "Sorry, the AI model is taking too long to respond. Please try again.";
      }
      if (error.response?.status === 404) {
        return `Sorry, the AI model "${aiConfig.OLLAMA_CHAT_MODEL}" is not available. Please check if it's installed in Ollama.`;
      }
      if (error.message) {
        return `Sorry, there was an error communicating with the AI model: ${error.message}`;
      }
      
      return "Sorry, there was an unexpected error generating the response.";
    }
  }
} 