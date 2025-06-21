import { NoteEmbeddingService } from './notes.embedding.service';
import { Note } from './notes.entity';
import { Repository } from 'typeorm';

export class NotesChatService {
  private readonly embeddingService: NoteEmbeddingService;
  private readonly noteRepo: Repository<Note>;

  constructor(embeddingService: NoteEmbeddingService, noteRepo: Repository<Note>) {
    this.embeddingService = embeddingService;
    this.noteRepo = noteRepo;
  }

  // Placeholder for embedding generation (should call Ollama or other model)
  async generateEmbedding(text: string): Promise<number[]> {
    // TODO: Integrate with Ollama
    return [];
  }

  // Compute cosine similarity between two vectors
  cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dot / (normA * normB);
  }

  async findRelevantNotes(question: string, topK = 3): Promise<Note[]> {
    const questionEmbedding = await this.generateEmbedding(question);
    const allEmbeddings = await this.embeddingService.findAll();
    const similarities = allEmbeddings.map(e => ({
      noteId: e.noteId,
      score: this.cosineSimilarity(questionEmbedding, e.embedding),
    }));
    similarities.sort((a, b) => b.score - a.score);
    const topNoteIds = similarities.slice(0, topK).map(s => s.noteId);
    return this.noteRepo.findByIds(topNoteIds);
  }
} 