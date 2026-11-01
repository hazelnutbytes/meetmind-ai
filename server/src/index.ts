import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { meetingsRouter } from './routes/meetings.js';
import { actionsRouter } from './routes/actions.js';
import { dashboardRouter } from './routes/dashboard.js';
import { evaluationsRouter } from './routes/evaluations.js';
import { automationRouter } from './routes/automation.js';
import { settingsRouter } from './routes/settings.js';
import { seedDatabaseIfEmpty } from './db/seed.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'MeetMind AI Server',
    gemini_ready: config.hasGeminiKey,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/meetings', meetingsRouter);
app.use('/api/actions', actionsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/evaluations', evaluationsRouter);
app.use('/api/automation', automationRouter);
app.use('/api/settings', settingsRouter);

// Start Server
app.listen(config.port, async () => {
  console.log(`\n=================================================`);
  console.log(`🧠 MeetMind AI Backend Server active on port ${config.port}`);
  console.log(`   Health check: http://localhost:${config.port}/api/health`);
  console.log(`   Gemini Status: ${config.hasGeminiKey ? 'Configured ✅' : 'Missing GEMINI_API_KEY ⚠️'}`);
  console.log(`   Supabase Status: ${config.hasSupabase ? 'Configured ✅' : 'Local Fallback Storage ℹ️'}`);
  console.log(`=================================================\n`);

  await seedDatabaseIfEmpty();
});

export default app;
