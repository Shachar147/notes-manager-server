import { AppDataSource } from '../src/config/database';
import { Note } from '../src/features/notes/notes.entity';
import { NoteEmbedding } from '../src/features/notes/notes.embedding.entity';
import axios from 'axios';
import { aiConfig } from '../src/config/ai';

// DEBUGGING: Check the value of REDIS_HOST
console.log(`DEBUG: Connecting to Redis with host: ${process.env.REDIS_HOST}`);

async function generateEmbedding(text: string): Promise<number[]> {
    const url = `${aiConfig.OLLAMA_URL}/api/embeddings`;
    console.log(`calling ${url} with text in size: ${text.length}`);
  const response = await axios.post(url, {
    model: 'nomic-embed-text', // or your preferred Ollama embedding model
    prompt: text,
  });
  console.log("hereee", response.data)
  // @ts-expect-error
  if (!response.data || !response.data.embedding) {
    throw new Error('Failed to get embedding from Ollama');
  }
  // @ts-expect-error
  return response.data.embedding;
}

async function migrateEmbeddings() {
  await AppDataSource.initialize();
  const noteRepo = AppDataSource.getRepository(Note);
  const embeddingRepo = AppDataSource.getRepository(NoteEmbedding);

  const notes = await noteRepo.find();
  for (const note of notes) {
    console.log(`trying to migrate embedding of {node.id}`);
    const text = `${note.title}\n${note.content}`;
    const embedding = await generateEmbedding(text);
    const noteEmbedding = embeddingRepo.create({
      noteId: note.id,
      embedding,
    });
    await embeddingRepo.save(noteEmbedding);
    console.log(`Embedded note ${note.id}`);
  }
  console.log('Migration complete!');
  process.exit(0);
}

migrateEmbeddings().catch(err => {
  console.error(err);
  process.exit(1);
}); 