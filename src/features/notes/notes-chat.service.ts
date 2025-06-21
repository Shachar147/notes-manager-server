import { NoteEmbeddingService } from './notes.embedding.service';
import { Note } from './notes.entity';
import { Repository } from 'typeorm';
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
    const questionEmbedding = await this.embeddingService.generateEmbedding(question);
    const allEmbeddings = await this.embeddingService.findAll();
    const similarities = allEmbeddings.map(e => ({
      noteId: e.noteId,
      score: this.cosineSimilarity(questionEmbedding, e.embedding),
    }));
    similarities.sort((a, b) => b.score - a.score);
    const topNoteIds = similarities.slice(0, topK).map(s => s.noteId);
    return this.noteRepo.findByIds(topNoteIds);
  }

  async generateChatResponse(question: string, notes: Note[]): Promise<string> {
    const CONTEXT_MAX_LENGTH = 1000; // Max characters per note to send to the model
    const context = notes
      .map(n => `Note Title: ${n.title}\nNote Content: ${n.content.substring(0, CONTEXT_MAX_LENGTH)}`)
      .join('\n\n---\n\n');
    const prompt = `Based on the following context, please provide a short answer to the user's question. If the context is not relevant, say you don't know. Context:\n\n${context}\n\nUser Question: ${question}`;

    console.log(`trying to generate chat response for ${question}`);
    logger.info(`trying to generate chat response for ${question}`);

    const response = await axios.post<OllamaGenerateResponse>(`${aiConfig.OLLAMA_URL}/api/generate`, {
      model: aiConfig.OLLAMA_CHAT_MODEL,
      prompt,
      stream: false,
    });

    console.log("response receieved!");
    logger.info("response receieved!");

    return response.data.response;
  }
} 