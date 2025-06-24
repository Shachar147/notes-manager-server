import { AppDataSource } from '../src/config/database';
import { Note } from '../src/features/notes/notes.entity';
import { NoteEmbedding } from '../src/features/notes/notes.embedding.entity';
import { NoteEmbeddingService } from '../src/features/notes/notes.embedding.service';
import { NoteEmbeddingRepository } from '../src/features/notes/notes.embedding.repository';

// DEBUGGING: Check the value of REDIS_HOST
console.log(`DEBUG: Connecting to Redis with host: ${process.env.REDIS_HOST}`);

async function migrateEmbeddings() {
  await AppDataSource.initialize();
  const noteRepo = AppDataSource.getRepository(Note);
  // Get the custom repository for NoteEmbedding
  const embeddingRepo = AppDataSource.getRepository(NoteEmbedding) as unknown as NoteEmbeddingRepository;
  const embeddingService = new NoteEmbeddingService(embeddingRepo);

  const notes = await noteRepo.find();
  for (const note of notes) {
    console.log(`trying to migrate embedding of ${note.id}`);
    const text = `${note.title}\n${note.content}`;
    const embedding = await embeddingService.generateEmbedding(text);

    const existing = await embeddingRepo.findBy({
      noteId: note.id
    })
    const payload = {
      noteId: note.id,
      embedding,
    };
    if (existing?.length){
      await embeddingRepo.update({ noteId: note.id }, payload);
      console.log(`Updated embedding for note ${note.id}`, '\n');
    } else {
      const noteEmbedding = embeddingRepo.create(payload);
      await embeddingRepo.save(noteEmbedding);
      console.log(`Created embedding for note ${note.id}`,'\n');
    }
  }
  console.log('Migration complete!');
  process.exit(0);
}

migrateEmbeddings().catch(err => {
  console.error(err);
  process.exit(1);
}); 