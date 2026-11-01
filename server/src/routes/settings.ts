import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';
import { db } from '../db/index.js';

export const settingsRouter = Router();

settingsRouter.get('/status', (_req: Request, res: Response): void => {
  res.json({
    gemini: {
      is_configured: config.hasGeminiKey,
      model: config.geminiModel,
      masked_key: config.geminiApiKey
        ? `${config.geminiApiKey.slice(0, 4)}...${config.geminiApiKey.slice(-4)}`
        : null
    },
    supabase: {
      is_configured: config.hasSupabase,
      is_connected: db.isSupabaseConnected(),
      url: config.supabaseUrl || null,
      storage_mode: db.isSupabaseConnected() ? 'Supabase PostgreSQL' : 'Persistent Local Fallback'
    },
    environment: config.nodeEnv
  });
});

settingsRouter.post('/test-gemini', async (req: Request, res: Response): Promise<void> => {
  const apiKey = req.body.api_key || config.geminiApiKey;

  if (!apiKey || apiKey.trim().length === 0) {
    res.status(400).json({ success: false, error: 'No API key provided.' });
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const model = genAI.getGenerativeModel({ model: config.geminiModel });
    const ping = await model.generateContent('Return exactly: {"status": "ok"} in JSON format.');
    const text = ping.response.text();

    res.json({
      success: true,
      message: 'Gemini API connection verified successfully.',
      raw_response: text
    });
  } catch (err: any) {
    res.status(502).json({
      success: false,
      error: `Gemini verification failed: ${err.message}`
    });
  }
});
