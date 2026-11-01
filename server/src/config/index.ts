import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root or local directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseWebhookSecret: process.env.SUPABASE_WEBHOOK_SECRET || '',
  nodeEnv: process.env.NODE_ENV || 'development',
  hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5),
  hasSupabase: Boolean(
    (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL) &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
  )
};
