import { NoteEmbedding } from './notes.embedding.entity';
import { NoteEmbeddingRepository } from './notes.embedding.repository';
import axios from 'axios';
import { aiConfig } from '../../config/ai';

interface OllamaEmbeddingResponse {
  embedding: number[];
}

export class NoteEmbeddingService {
  private readonly embeddingRepo: NoteEmbeddingRepository;

  constructor(embeddingRepo: NoteEmbeddingRepository) {
    this.embeddingRepo = embeddingRepo;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await axios.post<OllamaEmbeddingResponse>(`${aiConfig.OLLAMA_URL}/api/embeddings`, {
      model: aiConfig.OLLAMA_EMBEDDING_MODEL,
      prompt: text,
    });
    return response.data.embedding;
  }

  async createOrUpdateEmbedding(noteId: string, embedding: number[]): Promise<NoteEmbedding> {
    let noteEmbedding = await this.embeddingRepo.findOne({ where: { noteId } });
    if (noteEmbedding) {
      noteEmbedding.embedding = embedding;
      return this.embeddingRepo.save(noteEmbedding);
    } else {
      noteEmbedding = this.embeddingRepo.create({ noteId, embedding });
      return this.embeddingRepo.save(noteEmbedding);
    }
  }

  async findByNoteId(noteId: string): Promise<NoteEmbedding | null> {
    return this.embeddingRepo.findOne({ where: { noteId } });
  }

  async findAll(): Promise<NoteEmbedding[]> {
    return this.embeddingRepo.find();
  }
} 