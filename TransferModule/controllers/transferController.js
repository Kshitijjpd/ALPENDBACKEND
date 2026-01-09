// transferController.js
import { directTransfer, getTransferHistory } from '../services/transferService.js';

// ============================================
// POST: /api/transfer/direct
// ============================================
export async function transferTokens(req, res) {
  try {
    const { sender, receiver, amount } = req.body;
    
    // Validation
    if (!sender || !receiver || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sender, receiver, amount'
      });
    }
    
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }
    
    console.log(`\n🔄 Transfer Request:`);
    console.log(`   From: ${sender.substring(0, 40)}...`);
    console.log(`   To: ${receiver.substring(0, 40)}...`);
    console.log(`   Amount: ${amount}\n`);
    
    // Execute transfer
    const result = await directTransfer(sender, receiver, amount);
    
    return res.status(200).json(result);
    
  } catch (err) {
    console.error('❌ Transfer Error:', err.error || err.message);
    
    return res.status(err.status || 500).json({
      success: false,
      error: err.error || err.message,
      details: err.details || null
    });
  }
}

// ============================================
// GET: /api/transfer/history/:partyId
// ============================================
export async function getHistory(req, res) {
  try {
    const { partyId } = req.params;
    
    if (!partyId) {
      return res.status(400).json({
        success: false,
        error: 'Party ID is required'
      });
    }
    
    console.log(`\n📜 Fetching transfer history for: ${partyId.substring(0, 40)}...\n`);
    
    const result = await getTransferHistory(partyId);
    
    return res.status(200).json(result);
    
  } catch (err) {
    console.error('❌ History Error:', err.error || err.message);
    
    return res.status(500).json({
      success: false,
      error: err.error || err.message
    });
  }
}