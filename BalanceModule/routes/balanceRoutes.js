// routes/balanceRoutes.js
import express from 'express';
import * as balanceController from '../controllers/balanceController.js';

const router = express.Router();

// Health check
router.get('/health', balanceController.healthCheck);

// Balance endpoints
router.get('/balance', balanceController.getAllBalances);
router.get('/balance/:ownerAddress', balanceController.getBalanceByOwner);
router.post('/balance/query', balanceController.advancedQuery);

// Contract endpoints
router.get('/contracts/:ownerAddress', balanceController.getContractsByOwner);

export default router;