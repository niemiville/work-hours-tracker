import express from 'express';
import { getTimeEntries, createTimeEntry, updateTimeEntry, deleteTimeEntry, getEntriesByDate, getLatestEntriesBeforeDate } from '../controllers/timeEntryController';
import { authenticate } from '../controllers/authController';

const router = express.Router();

router.get('/', authenticate, getTimeEntries);
router.get('/date/:date', authenticate, getEntriesByDate);
router.get('/latest-before/:date', authenticate, getLatestEntriesBeforeDate);
router.post('/', authenticate, createTimeEntry);
router.put('/:id', authenticate, updateTimeEntry);
router.delete('/:id', authenticate, deleteTimeEntry);

export default router;
