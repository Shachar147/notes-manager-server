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
    const message = `Incoming Request ${req.method} ${req.originalUrl}`;
    console.log(message);
    logger.info(message, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
    });
    next();
});

app.use('/notes', notesRoutes);
app.use('/audit', auditRoutes);

export default app;