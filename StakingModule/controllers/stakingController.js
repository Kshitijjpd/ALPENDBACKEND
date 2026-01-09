import stakingService from "../services/stakingService.js";

// Get configuration
export const getConfig = (req, res) => {
  try {
    const config = stakingService.getConfig();
    res.json(config);
  } catch (error) {
    console.error("Config error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Create staking pool
export const createPool = async (req, res) => {
  try {
    const { issuer } = req.body;

    if (!issuer) {
      return res.status(400).json({
        error:
          "issuer is required. Use the token issuer from /holdings response.",
        hint: 'POST /pool/create with body: { "issuer": "party-id::namespace" }',
      });
    }

    const result = await stakingService.createPool(issuer);
    res.json(result);
  } catch (error) {
    console.error("Create pool error:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
};

// Add staker to pool
export const addStaker = async (req, res) => {
  try {
    const { poolContractId, newStaker } = req.body;

    if (!poolContractId || !newStaker) {
      return res.status(400).json({
        error: "poolContractId and newStaker are required",
        hint: 'POST /pool/add-staker with body: { "poolContractId": "...", "newStaker": "party::namespace" }',
      });
    }

    const result = await stakingService.addStaker(poolContractId, newStaker);
    res.json(result);
  } catch (error) {
    console.error("Add staker error:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
};

// Get pool by ID
export const getPool = async (req, res) => {
  try {
    const { poolContractId } = req.params;

    if (!poolContractId) {
      return res.status(400).json({ error: "poolContractId is required" });
    }

    const pool = await stakingService.getPoolById(poolContractId);

    if (!pool) {
      return res.status(404).json({ error: "Pool not found" });
    }

    res.json({ success: true, pool });
  } catch (error) {
    console.error("Get pool error:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
};

// Deposit (lock) tokens
export const deposit = async (req, res) => {
  try {
    const { poolContractId, staker, holdingCid, amount } = req.body;

    if (!poolContractId || !staker || !holdingCid || !amount) {
      return res.status(400).json({
        error: "poolContractId, staker, holdingCid, and amount are required",
        hint: 'POST /pool/deposit with body: { "poolContractId": "...", "staker": "party::namespace", "holdingCid": "...", "amount": "100" }',
      });
    }

    const result = await stakingService.deposit(
      poolContractId,
      staker,
      holdingCid,
      amount
    );
    res.json(result);
  } catch (error) {
    console.error("Deposit error:", error.response?.data || error.message);

    // Return friendly error message
    const errorMessage =
      error.message || error.response?.data?.cause || "Deposit failed";
    res.status(500).json({ error: errorMessage });
  }
};

// Withdraw (unlock) tokens
export const withdraw = async (req, res) => {
  try {
    const { stakeContractId, staker } = req.body;

    if (!stakeContractId || !staker) {
      return res.status(400).json({
        error: "stakeContractId and staker are required",
        hint: 'POST /stake/withdraw with body: { "stakeContractId": "...", "staker": "party::namespace" }',
      });
    }

    const result = await stakingService.withdraw(stakeContractId, staker);
    res.json(result);
  } catch (error) {
    console.error("Withdraw error:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
};

// Get all pools
export const getPools = async (req, res) => {
  try {
    const result = await stakingService.queryPools();
    res.json(result);
  } catch (error) {
    console.error("Query pools error:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
};

// Get stakes for a staker
export const getStakes = async (req, res) => {
  try {
    const staker = req.query.staker || process.env.VALIDATOR_PARTY;
    const result = await stakingService.queryStakes(staker);
    res.json(result);
  } catch (error) {
    console.error("Query stakes error:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
};

// Get holdings for an owner
export const getHoldings = async (req, res) => {
  try {
    const owner = req.query.owner || process.env.VALIDATOR_PARTY;
    const result = await stakingService.queryHoldings(owner);
    res.json(result);
  } catch (error) {
    console.error(
      "Query holdings error:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: error.response?.data || error.message });
  }
};

// Get ledger end offset
export const getLedgerEnd = async (req, res) => {
  try {
    const offset = await stakingService.getLedgerEndOffset();
    res.json({ offset });
  } catch (error) {
    console.error("Ledger end error:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
};
