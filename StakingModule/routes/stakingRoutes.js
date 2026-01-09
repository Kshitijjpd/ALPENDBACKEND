import express from "express";
import * as stakingController from "../controllers/stakingController.js";

const router = express.Router();

// Config & Health
router.get("/config", stakingController.getConfig);
router.get("/ledger-end", stakingController.getLedgerEnd);

// Pool operations (Admin)
router.post("/pool/create", stakingController.createPool); // Create new pool with issuer
router.post("/pool/add-staker", stakingController.addStaker); // Add staker to pool
router.get("/pool/:poolContractId", stakingController.getPool); // Get pool details
router.get("/pools", stakingController.getPools); // List all pools

// Staking operations (User)
router.post("/pool/deposit", stakingController.deposit); // Deposit/lock tokens
router.post("/stake/withdraw", stakingController.withdraw); // Withdraw/unlock tokens
router.get("/stakes", stakingController.getStakes); // Query stakes (?staker=party)

// Holdings
router.get("/holdings", stakingController.getHoldings); // Query holdings (?owner=party)

export default router;
