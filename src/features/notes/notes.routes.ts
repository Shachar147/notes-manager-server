import { Router } from 'express';
import {
    getNoteById,
    getAllNotes,
    createNote,
    updateNote,
    deleteNote,
    duplicateNote
} from './notes.controller';

const router = Router();

router.get('/', getAllNotes);
router.get('/:id', getNoteById);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);
router.post('/:id/duplicate', duplicateNote);

export default router;