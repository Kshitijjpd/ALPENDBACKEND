import express from 'express';
import * as stakingController from '../controllers/stakingController.js';

const router = express.Router();

// Config
router.get('/config', stakingController.getConfig);

// Ledger
router.get('/ledger-end', stakingController.getLedgerEnd);

// Pool operations
router.post('/pool/create', stakingController.createPool);
router.post('/pool/add-staker', stakingController.addStaker);
router.post('/pool/deposit', stakingController.deposit);
router.get('/pools', stakingController.getPools);

// Stake operations
router.post('/stake/withdraw', stakingController.withdraw);
router.get('/stakes/:staker', stakingController.getStakes);

// Holdings
router.get('/holdings', stakingController.getHoldings);

export default router;