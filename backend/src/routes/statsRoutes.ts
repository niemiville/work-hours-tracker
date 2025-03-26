import express from 'express';
import { getStatsByTaskId, getStatsByTaskType, getStatsSummary, getStatsByTaskIdPerMonth, getStatsLast30Days } from '../controllers/statsController';
import { authenticate } from '../controllers/authController';

const router = express.Router();

router.get('/task-id', authenticate, getStatsByTaskId);
router.get('/task-type', authenticate, getStatsByTaskType);
router.get('/summary', authenticate, getStatsSummary);
router.get('/task-id-monthly', authenticate, getStatsByTaskIdPerMonth);
router.get('/last-30-days', authenticate, getStatsLast30Days);

export default router; 