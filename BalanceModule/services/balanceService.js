// services/balanceService.js
import axios from 'axios';
import { getToken } from '../../auth.js';

/**
 * Get latest ledger offset
 */
export async function getLatestOffset(token) {
  try {
    const response = await axios.get(
      `${process.env.LEDGER_URL}/v2/state/ledger-end`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.offset || "0";
  } catch (err) {
    console.log('⚠️  Could not fetch latest offset, using "0"');
    return "0";
  }
}

/**
 * Check balance for a party with optional owner filter
 * @param {string|null} partyId - Party ID to check (defaults to VALIDATOR_PARTY)
 * @param {string|null} filterByOwner - Owner address to filter by (optional)
 * @returns {Promise<Object>} Balance information
 */
export async function checkBalance(partyId = null, filterByOwner = null) {
  const token = await getToken();
  const targetParty = partyId || process.env.VALIDATOR_PARTY;
  
  try {
    const offset = await getLatestOffset(token);
    
    const response = await axios.post(
      `${process.env.LEDGER_URL}/v2/state/active-contracts`,
      {
        filter: {
          filtersByParty: {
            [targetParty]: {
              cumulative: [{
                identifierFilter: {
                  TemplateFilter: {
                    value: {
                      templateId: `${process.env.PACKAGE_ID}:CIP56.Token:CIP56Holding`,
                      includeCreatedEventBlob: true
                    }
                  }
                }
              }]
            }
          }
        },
        verbose: true,
        activeAtOffset: offset
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data || response.data.length === 0) {
      return { 
        totalBalance: "0", 
        totalaBTC: 0, 
        contracts: [],
        totalChecked: 0,
        filteredOut: 0
      };
    }
    
    let totalBalance = 0.0;
    const contracts = [];
    let totalContracts = 0;
    let filteredOutCount = 0;
    
    response.data.forEach((contract) => {
      const entry = contract?.contractEntry?.JsActiveContract;
      const event = entry?.createdEvent;
      const args = event?.createArgument;
      
      if (args) {
        totalContracts++;
        
        // Apply owner filter if specified
        if (filterByOwner && args.owner !== filterByOwner) {
          filteredOutCount++;
          return;
        }
        
        const amount = parseFloat(args.amount || 0);
        totalBalance += amount;
        
        const contractInfo = {
          owner: args.owner,
          amount: args.amount,
          aBTC: amount,
          contractId: event.contractId,
          createdAt: event.createdAt,
          issuer: args.issuer,
          meta: args.meta
        };
        
        contracts.push(contractInfo);
      }
    });
    
    return { 
      totalBalance: totalBalance.toString(), 
      totalaBTC: totalBalance,
      contracts,
      totalChecked: totalContracts,
      filteredOut: filteredOutCount,
      offset
    };
    
  } catch (err) {
    throw {
      status: err.response?.status || 500,
      code: err.response?.data?.code || 'UNKNOWN_ERROR',
      message: err.response?.data?.message || err.message,
      details: err.response?.data
    };
  }
}