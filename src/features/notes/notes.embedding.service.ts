import { NoteEmbedding } from './notes.embedding.entity';
import { NoteEmbeddingRepository } from './notes.embedding.repository';

export class NoteEmbeddingService {
  private readonly embeddingRepo: NoteEmbeddingRepository;

  constructor(embeddingRepo: NoteEmbeddingRepository) {
    this.embeddingRepo = embeddingRepo;
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