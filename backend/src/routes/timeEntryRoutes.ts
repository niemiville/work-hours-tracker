import express from 'express';
import { getTimeEntries, createTimeEntry, updateTimeEntry, deleteTimeEntry } from '../controllers/timeEntryController';
import { authenticate } from '../controllers/authController';

const router = express.Router();

router.get('/', authenticate, getTimeEntries);
router.post('/', authenticate, createTimeEntry);
router.put('/:id', authenticate, updateTimeEntry);
router.delete('/:id', authenticate, deleteTimeEntry);

export default router;
