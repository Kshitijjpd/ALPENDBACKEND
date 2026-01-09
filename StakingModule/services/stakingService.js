import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Config from env
const {
  LEDGER_URL,
  AUTH_URL,
  CLIENT_ID,
  CLIENT_SECRET,
  AUDIENCE,
  VALIDATOR_PARTY,
  DSO_PARTY,
  PACKAGE,
  QPACKAGE_ID2,
} = process.env;

// Template IDs
const STAKING_POOL = `${PACKAGE}:Staking:StakingPool`;
const STAKE = `${PACKAGE}:Staking:Stake`;
const CIP56_HOLDING = `${QPACKAGE_ID2}:CIP56.Token:CIP56Holding`;
const CANTON_COIN_ISSUER = DSO_PARTY;

// Auth token cache
let accessToken = null;
let tokenExpiry = 0;

// ===================================================
// Authentication
// ===================================================
async function getToken() {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const response = await axios.post(AUTH_URL, {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    audience: AUDIENCE,
    grant_type: "client_credentials",
  });

  accessToken = response.data.access_token;
  tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
  console.log("✓ Token refreshed");
  return accessToken;
}

// ===================================================
// Ledger API Helper
// ===================================================
async function ledgerRequest(endpoint, data, method = "POST") {
  const token = await getToken();
  const config = {
    method,
    url: `${LEDGER_URL}/v2/${endpoint}`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
  if (data && method === "POST") {
    config.data = data;
  }
  const response = await axios(config);
  return response.data;
}

// ===================================================
// Service Functions
// ===================================================

// Get config
export function getConfig() {
  return {
    ledgerUrl: LEDGER_URL,
    operator: VALIDATOR_PARTY,
    cantonCoinIssuer: CANTON_COIN_ISSUER,
    stakingPoolTemplate: STAKING_POOL,
    stakeTemplate: STAKE,
    cip56HoldingTemplate: CIP56_HOLDING,
  };
}

// Get ledger end offset
export async function getLedgerEndOffset() {
  const result = await ledgerRequest("state/ledger-end", null, "GET");
  return result.offset;
}

// Create staking pool
export async function createPool(issuer) {
  const poolIssuer = issuer || CANTON_COIN_ISSUER;

  const result = await ledgerRequest(
    "commands/submit-and-wait-for-transaction",
    {
      commands: {
        actAs: [VALIDATOR_PARTY],
        commandId: `create-pool-${Date.now()}`,
        commands: [
          {
            CreateCommand: {
              templateId: STAKING_POOL,
              createArguments: {
                operator: VALIDATOR_PARTY,
                issuer: poolIssuer,
                stakers: [],
              },
            },
          },
        ],
      },
    }
  );

  const createdEvent = result.transaction?.events?.find((e) => e.CreatedEvent);

  return {
    success: true,
    contractId: createdEvent?.CreatedEvent?.contractId,
    issuer: poolIssuer,
    transaction: result.transaction,
  };
}

// Add staker to pool
export async function addStaker(poolContractId, newStaker) {
  const result = await ledgerRequest(
    "commands/submit-and-wait-for-transaction",
    {
      commands: {
        actAs: [VALIDATOR_PARTY],
        commandId: `add-staker-${Date.now()}`,
        commands: [
          {
            ExerciseCommand: {
              templateId: STAKING_POOL,
              contractId: poolContractId,
              choice: "AddStaker",
              choiceArgument: {
                newStaker: newStaker,
              },
            },
          },
        ],
      },
    }
  );

  const createdEvent = result.transaction?.events?.find((e) => e.CreatedEvent);

  return {
    success: true,
    newPoolContractId: createdEvent?.CreatedEvent?.contractId,
    transaction: result.transaction,
  };
}

// Deposit tokens to pool
export async function deposit(poolContractId, staker, holdingCid, amount) {
  const result = await ledgerRequest(
    "commands/submit-and-wait-for-transaction",
    {
      commands: {
        actAs: [staker],
        readAs: [VALIDATOR_PARTY],
        commandId: `deposit-${Date.now()}`,
        commands: [
          {
            ExerciseCommand: {
              templateId: STAKING_POOL,
              contractId: poolContractId,
              choice: "Deposit",
              choiceArgument: {
                staker: staker,
                holdingCid: holdingCid,
                amount: amount.toString(),
              },
            },
          },
        ],
      },
    }
  );

  const stakeEvent = result.transaction?.events?.find((e) =>
    e.CreatedEvent?.templateId?.includes(":Stake")
  );

  return {
    success: true,
    stakeContractId: stakeEvent?.CreatedEvent?.contractId,
    transaction: result.transaction,
  };
}

// Withdraw tokens from stake
export async function withdraw(stakeContractId, staker) {
  const result = await ledgerRequest(
    "commands/submit-and-wait-for-transaction",
    {
      commands: {
        actAs: [staker],
        commandId: `withdraw-${Date.now()}`,
        commands: [
          {
            ExerciseCommand: {
              templateId: STAKE,
              contractId: stakeContractId,
              choice: "Withdraw",
              choiceArgument: {},
            },
          },
        ],
      },
    }
  );

  const holdingEvent = result.transaction?.events?.find((e) =>
    e.CreatedEvent?.templateId?.includes("CIP56Holding")
  );

  return {
    success: true,
    holdingContractId: holdingEvent?.CreatedEvent?.contractId,
    transaction: result.transaction,
  };
}

// Query all pools
export async function queryPools() {
  const offset = await getLedgerEndOffset();

  const result = await ledgerRequest("state/active-contracts", {
    filter: {
      filtersByParty: {
        [VALIDATOR_PARTY]: {
          cumulative: [
            {
              identifierFilter: {
                TemplateFilter: {
                  value: {
                    templateId: STAKING_POOL,
                    includeCreatedEventBlob: false,
                  },
                },
              },
            },
          ],
        },
      },
    },
    verbose: true,
    activeAtOffset: offset,
  });

  const pools = result
    .filter((r) => r.contractEntry?.JsActiveContract)
    .map((r) => ({
      contractId: r.contractEntry.JsActiveContract.createdEvent.contractId,
      ...r.contractEntry.JsActiveContract.createdEvent.createArgument,
    }));

  return {
    success: true,
    pools,
  };
}

// Query stakes for a staker
export async function queryStakes(staker) {
  const offset = await getLedgerEndOffset();

  const result = await ledgerRequest("state/active-contracts", {
    filter: {
      filtersByParty: {
        [staker]: {
          cumulative: [
            {
              identifierFilter: {
                TemplateFilter: {
                  value: {
                    templateId: STAKE,
                    includeCreatedEventBlob: false,
                  },
                },
              },
            },
          ],
        },
      },
    },
    verbose: true,
    activeAtOffset: offset,
  });

  const stakes = result
    .filter((r) => r.contractEntry?.JsActiveContract)
    .map((r) => ({
      contractId: r.contractEntry.JsActiveContract.createdEvent.contractId,
      ...r.contractEntry.JsActiveContract.createdEvent.createArgument,
    }));

  return {
    success: true,
    stakes,
  };
}

// Query holdings for an owner
export async function queryHoldings(owner) {
  const offset = await getLedgerEndOffset();

  console.log("Querying holdings for:", owner);
  console.log("Using template:", CIP56_HOLDING);

  const result = await ledgerRequest("state/active-contracts", {
    filter: {
      filtersByParty: {
        [owner]: {
          cumulative: [
            {
              identifierFilter: {
                TemplateFilter: {
                  value: {
                    templateId: CIP56_HOLDING,
                    includeCreatedEventBlob: false,
                  },
                },
              },
            },
          ],
        },
      },
    },
    verbose: true,
    activeAtOffset: offset,
  });

  console.log("Got", result.length, "holdings");

  const holdings = result
    .filter((r) => r.contractEntry?.JsActiveContract)
    .map((r) => {
      const event = r.contractEntry.JsActiveContract.createdEvent;
      return {
        contractId: event.contractId,
        issuer: event.createArgument.issuer,
        owner: event.createArgument.owner,
        amount: event.createArgument.amount,
        isCantonCoin: event.createArgument.issuer === CANTON_COIN_ISSUER,
      };
    });

  return {
    success: true,
    queryParty: owner,
    holdings: holdings,
    count: holdings.length,
    totalAmount: holdings.reduce((sum, h) => sum + parseFloat(h.amount || 0), 0),
  };
}

export default {
  getConfig,
  getLedgerEndOffset,
  createPool,
  addStaker,
  deposit,
  withdraw,
  queryPools,
  queryStakes,
  queryHoldings,
};