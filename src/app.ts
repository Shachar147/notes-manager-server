import express from 'express';
import cors from 'cors';
import notesRoutes from './features/notes/notes.routes';

const app = express();

app.use(cors());
app.use(express.json())

app.use('/notes', notesRoutes)

export default app;