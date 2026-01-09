// transferRoutes.js
import express from 'express';
import { transferTokens, getHistory } from '../controllers/transferController.js';

const router = express.Router();

// ============================================
// Transfer Routes
// ============================================

/**
 * POST /api/transfer/direct
 * Body: { sender, receiver, amount }
 * Description: Transfer tokens directly (atomic)
 */
router.post('/direct', transferTokens);

/**
 * GET /api/transfer/history/:partyId
 * Description: Get transfer history for a party
 */
router.get('/history/:partyId', getHistory);

export default router;