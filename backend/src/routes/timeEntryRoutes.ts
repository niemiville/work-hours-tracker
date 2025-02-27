import express from 'express';
import { getTimeEntries, createTimeEntry, updateTimeEntry } from '../controllers/timeEntryController';

const router = express.Router();

router.get('/', getTimeEntries);
router.post('/', createTimeEntry);
router.put('/:id', updateTimeEntry);

export default router;
