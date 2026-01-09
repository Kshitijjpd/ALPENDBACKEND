import stakingService from '../services/stakingService.js';

// Get configuration
export const getConfig = (req, res) => {
  try {
    const config = stakingService.getConfig();
    res.json(config);
  } catch (error) {
    console.error('Config error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Create staking pool
export const createPool = async (req, res) => {
  try {
    const { issuer } = req.body;
    const result = await stakingService.createPool(issuer);
    res.json(result);
  } catch (error) {
    console.error('Create pool error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
};

// Add staker to pool
export const addStaker = async (req, res) => {
  try {
    const { poolContractId, newStaker } = req.body;
    const result = await stakingService.addStaker(poolContractId, newStaker);
    res.json(result);
  } catch (error) {
    console.error('Add staker error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
};

// Deposit (lock) tokens
export const deposit = async (req, res) => {
  try {
    const { poolContractId, staker, holdingCid, amount } = req.body;
    const result = await stakingService.deposit(poolContractId, staker, holdingCid, amount);
    res.json(result);
  } catch (error) {
    console.error('Deposit error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
};

// Withdraw (unlock) tokens
export const withdraw = async (req, res) => {
  try {
    const { stakeContractId, staker } = req.body;
    const result = await stakingService.withdraw(stakeContractId, staker);
    res.json(result);
  } catch (error) {
    console.error('Withdraw error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
};

// Get all pools
export const getPools = async (req, res) => {
  try {
    const result = await stakingService.queryPools();
    res.json(result);
  } catch (error) {
    console.error('Query pools error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
};

// Get stakes for a staker
export const getStakes = async (req, res) => {
  try {
    const { staker } = req.params;
    const result = await stakingService.queryStakes(staker);
    res.json(result);
  } catch (error) {
    console.error('Query stakes error:', error.response?.data || error.message);
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
    console.error('Query holdings error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
};

// Get ledger end offset
export const getLedgerEnd = async (req, res) => {
  try {
    const offset = await stakingService.getLedgerEndOffset();
    res.json({ offset });
  } catch (error) {
    console.error('Ledger end error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
};