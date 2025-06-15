import express from 'express';
import cors from 'cors';
import notesRoutes from './features/notes/notes.routes';
import auditRoutes from './features/audit/audit.routes';
import {requestIdMiddleware} from "./middlewares/request-id.middleware";
import {elasticLoggerMiddleware} from "./middlewares/elastic-logger.middleware";

const app = express();

app.use(cors());
app.use(express.json())

app.use(requestIdMiddleware);
app.use(elasticLoggerMiddleware); // Request logging middleware

app.use('/notes', notesRoutes);
app.use('/audit', auditRoutes);

export default app;