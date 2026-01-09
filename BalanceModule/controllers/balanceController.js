// controllers/balanceController.js
import * as balanceService from '../services/balanceService.js';

/**
 * Health check endpoint
 */
export const healthCheck = (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'Alpend Balance API',
    timestamp: new Date().toISOString()
  });
};

/**
 * Get all token balances (no filter)
 */
export const getAllBalances = async (req, res) => {
  try {
    console.log('📊 API Request: Get all balances');
    const result = await balanceService.checkBalance();
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ API Error:', error.message);
    res.status(error.status || 500).json({
      success: false,
      error: {
        code: error.code,
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get balance for specific owner
 */
export const getBalanceByOwner = async (req, res) => {
  try {
    const { ownerAddress } = req.params;
    console.log('📊 API Request: Get balance for owner:', ownerAddress.substring(0, 40) + '...');
    
    const result = await balanceService.checkBalance(null, ownerAddress);
    
    res.json({
      success: true,
      data: result,
      owner: ownerAddress,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ API Error:', error.message);
    res.status(error.status || 500).json({
      success: false,
      error: {
        code: error.code,
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Advanced query with partyId and owner filter
 */
export const advancedQuery = async (req, res) => {
  try {
    const { partyId, ownerAddress } = req.body;
    console.log('📊 API Request: Advanced query');
    console.log('├─ Party:', partyId || 'default');
    console.log('└─ Owner:', ownerAddress || 'all');
    
    const result = await balanceService.checkBalance(partyId, ownerAddress);
    
    res.json({
      success: true,
      data: result,
      query: {
        partyId: partyId || process.env.VALIDATOR_PARTY,
        ownerAddress: ownerAddress || 'all'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ API Error:', error.message);
    res.status(error.status || 500).json({
      success: false,
      error: {
        code: error.code,
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get detailed contract list for specific owner
 */
export const getContractsByOwner = async (req, res) => {
  try {
    const { ownerAddress } = req.params;
    console.log('📦 API Request: Get contracts for owner:', ownerAddress.substring(0, 40) + '...');
    
    const result = await balanceService.checkBalance(null, ownerAddress);
    
    res.json({
      success: true,
      data: {
        contracts: result.contracts,
        count: result.contracts.length,
        totalBalance: result.totalBalance,
        totalPLDM: result.totalPLDM
      },
      owner: ownerAddress,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ API Error:', error.message);
    res.status(error.status || 500).json({
      success: false,
      error: {
        code: error.code,
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};