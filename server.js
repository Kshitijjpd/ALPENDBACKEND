// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import balanceRoutes from './BalanceModule/routes/balanceRoutes.js';
import transferRoutes from './TransferModule/routes/transferRoutes.js';
import stakingRoutes from './StakingModule/routes/stakingRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// ============================================
// Middleware
// ============================================
app.use(cors());
app.use(express.json());

// ============================================
// Routes
// ============================================
app.use('/api/balance', balanceRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/staking', stakingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: ['balance', 'transfer']
  });
});

// ============================================
// Start Server
// ============================================
app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 ALPEND BALANCE & TRANSFER API SERVER STARTED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔗 Server running on: http://localhost:${PORT}`);
  console.log('');
  console.log('📍 Available Endpoints:');
  console.log('   GET  /api/health');
  console.log('   GET  /api/balance/:partyId');
  console.log('   POST /api/transfer/direct');
  console.log('   GET  /api/transfer/history/:partyId');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});