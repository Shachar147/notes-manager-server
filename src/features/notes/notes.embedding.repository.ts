import { EntityRepository, Repository } from 'typeorm';
import { NoteEmbedding } from './notes.embedding.entity';

@EntityRepository(NoteEmbedding)
export class NoteEmbeddingRepository extends Repository<NoteEmbedding> {} 