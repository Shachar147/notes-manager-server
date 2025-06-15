import express from 'express';
import cors from 'cors';
import notesRoutes from './features/notes/notes.routes';
import auditRoutes from './features/audit/audit.routes';

const app = express();

app.use(cors());
app.use(express.json())

app.use('/notes', notesRoutes)
app.use('/audit', auditRoutes)

export default app;