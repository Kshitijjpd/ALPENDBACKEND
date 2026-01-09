// transferService.js
import axios from 'axios';
import { getToken } from '../../auth.js';
import dotenv from 'dotenv';
dotenv.config();

// ============================================
// HELPER: Get Latest Offset
// ============================================
async function getLatestOffset(token) {
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
    return "0";
  }
}

// ============================================
// HELPER: Get Holding Contract ID
// ============================================
async function getHoldingContractId(token, owner) {
  const offset = await getLatestOffset(token);
  
  const response = await axios.post(
    `${process.env.LEDGER_URL}/v2/state/active-contracts`,
    {
      filter: {
        filtersByParty: {
          [owner]: {
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
    throw new Error('No holdings found for sender');
  }
  
  const holdings = response.data
    .map(contract => {
      const event = contract?.contractEntry?.JsActiveContract?.createdEvent;
      const args = event?.createArgument;
      
      return {
        contractId: event.contractId,
        amount: parseFloat(args.amount),
        owner: args.owner,
        issuer: args.issuer,
        meta: args.meta
      };
    })
    .filter(h => h.owner === owner);
  
  if (holdings.length === 0) {
    throw new Error(`No holdings found where owner matches sender`);
  }
  
  return holdings;
}

// ============================================
// SERVICE: Direct Transfer
// ============================================
export async function directTransfer(sender, receiver, amountPLDM) {
  const token = await getToken();
  const amountWei = (amountPLDM * 1e18).toString();
  
  try {
    // Step 1: Get sender's holdings
    const holdings = await getHoldingContractId(token, sender);
    
    // Find holding with sufficient balance
    const senderHolding = holdings.find(h => h.amount >= amountPLDM * 1e18);
    
    if (!senderHolding) {
      throw new Error(`Insufficient balance. Required: ${amountPLDM} tokens`);
    }
    
    // Step 2: Execute Transfer
    const response = await axios.post(
      `${process.env.LEDGER_URL}/v2/commands/submit-and-wait`,
      {
        commands: [{
          ExerciseCommand: {
            templateId: `${process.env.PACKAGE_ID}:CIP56.Token:CIP56Holding`,
            contractId: senderHolding.contractId,
            choice: "Transfer",
            choiceArgument: {
              to: receiver,
              value: amountWei,
              complianceRulesCid: null,
              complianceProofCid: null
            }
          }
        }],
        commandId: `transfer-${Date.now()}`,
        actAs: [sender]
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Extract created contracts
    const createdEvents = response.data.events?.filter(e => e.CreatedEvent) || [];
    const newContracts = createdEvents.map(event => {
      const created = event.CreatedEvent;
      const args = created.createArgument;
      
      return {
        owner: args.owner,
        amount: parseFloat(args.amount) / 1e18,
        symbol: args.meta?.symbol || 'PLDM',
        contractId: created.contractId
      };
    });
    
    return {
      success: true,
      transactionDetails: {
        updateId: response.data.updateId,
        offset: response.data.completionOffset,
        status: response.data.status || 'Completed'
      },
      transferDetails: {
        from: sender,
        to: receiver,
        amount: amountPLDM,
        symbol: senderHolding.meta?.symbol || 'PLDM',
        senderBalanceBefore: senderHolding.amount / 1e18
      },
      newContracts
    };
    
  } catch (err) {
    throw {
      success: false,
      error: err.response?.data?.message || err.message,
      status: err.response?.status,
      details: err.response?.data
    };
  }
}

// ============================================
// SERVICE: Get Transfer History (Bonus)
// ============================================
export async function getTransferHistory(partyId) {
  const token = await getToken();
  
  try {
    const offset = await getLatestOffset(token);
    
    const response = await axios.post(
      `${process.env.LEDGER_URL}/v2/state/events-range`,
      {
        eventFilters: [{
          filtersByParty: {
            [partyId]: {
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
        }],
        startExclusive: "0",
        endInclusive: offset
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const transfers = response.data.events?.map(event => {
      if (event.CreatedEvent) {
        const args = event.CreatedEvent.createArgument;
        return {
          type: 'received',
          owner: args.owner,
          amount: parseFloat(args.amount) / 1e18,
          symbol: args.meta?.symbol || 'PLDM',
          timestamp: event.CreatedEvent.createdAt
        };
      }
      return null;
    }).filter(Boolean) || [];
    
    return {
      success: true,
      partyId,
      transfers
    };
    
  } catch (err) {
    throw {
      success: false,
      error: err.response?.data?.message || err.message
    };
  }
}