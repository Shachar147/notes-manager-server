import express from 'express';
import cors from 'cors';
import notesRoutes from './features/notes/notes.routes';
import auditRoutes from './features/audit/audit.routes';
import logger from "./utils/logger";

const app = express();

app.use(cors());
app.use(express.json())

// Request logging middleware
app.use((req, res, next) => {
    logger.info('Incoming request', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
    });
    next();
});

app.use('/notes', notesRoutes);
app.use('/audit', auditRoutes);

export default app;