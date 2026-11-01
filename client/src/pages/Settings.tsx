import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  ShieldCheck,
  Server
} from 'lucide-react';
import { api } from '../services/api';

export const Settings: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testKey, setTestKey] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await api.getSettingsStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load settings status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestKey = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const res = await api.testGeminiKey(testKey.trim() || undefined);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const sampleEnv = `# MeetMind AI Environment Configuration
PORT=5001
NODE_ENV=development

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Supabase PostgreSQL & Edge Functions
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_WEBHOOK_SECRET=your_webhook_secret_here`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleEnv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-terracotta/10 text-terracotta text-xs font-semibold mb-1">
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>System Environment & Integrations</span>
        </div>
        <h1 className="font-serif text-3xl text-charcoal">System Settings & Health</h1>
        <p className="text-sm text-charcoal/70">
          Verification of Google Gemini AI API credentials and Supabase database connections.
        </p>
      </div>

      {/* Integration Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gemini Status Card */}
        <div className="bg-white border border-sand rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-sand">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded bg-terracotta/10 text-terracotta flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-charcoal">Google Gemini AI</h3>
                <p className="text-xs text-charcoal/50">Large Language Model Engine</p>
              </div>
            </div>

            {status?.gemini?.is_configured ? (
              <span className="flex items-center space-x-1 text-sage text-xs font-bold bg-sage-light px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Configured</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-gold text-xs font-bold bg-gold-light px-2.5 py-1 rounded-full">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Key Missing</span>
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-sand/40">
              <span className="text-charcoal/60">Target Model:</span>
              <span className="font-mono font-semibold text-charcoal">
                {status?.gemini?.model || 'gemini-2.5-flash'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-sand/40">
              <span className="text-charcoal/60">API Key Status:</span>
              <span className="font-mono text-charcoal">
                {status?.gemini?.masked_key || 'Not configured in .env'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-charcoal/60">Operational Mode:</span>
              <span className="font-medium text-sage">
                {status?.gemini?.is_configured ? 'Live API Processing' : 'Benchmark Evaluation Mode'}
              </span>
            </div>
          </div>

          {/* Test Key Form */}
          <div className="pt-3 border-t border-sand space-y-2">
            <label className="text-xs font-semibold text-charcoal block">
              Ping Test Gemini API:
            </label>
            <div className="flex space-x-2">
              <input
                type="password"
                value={testKey}
                onChange={(e) => setTestKey(e.target.value)}
                placeholder="Leave blank to test .env key, or paste key here"
                className="flex-1 px-3 py-1.5 border border-sand rounded bg-ivory text-xs focus:outline-none focus:border-terracotta"
              />
              <button
                onClick={handleTestKey}
                disabled={testing}
                className="bg-terracotta hover:bg-terracotta-hover text-white px-3.5 py-1.5 rounded text-xs font-semibold transition-colors shrink-0"
              >
                {testing ? 'Testing...' : 'Test Key'}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded text-xs mt-2 ${
                  testResult.success
                    ? 'bg-sage-light text-sage border border-sage/40'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {testResult.success ? (
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Gemini API connection confirmed operational!</span>
                  </div>
                ) : (
                  <div>
                    <span className="font-bold">Error:</span> {testResult.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Supabase Status Card */}
        <div className="bg-white border border-sand rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-sand">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded bg-sage/10 text-sage flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-charcoal">Supabase PostgreSQL</h3>
                <p className="text-xs text-charcoal/50">Relational Database & Edge Functions</p>
              </div>
            </div>

            {status?.supabase?.is_connected ? (
              <span className="flex items-center space-x-1 text-sage text-xs font-bold bg-sage-light px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connected</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-gold text-xs font-bold bg-gold-light px-2.5 py-1 rounded-full">
                <Server className="w-3.5 h-3.5" />
                <span>Local Fallback</span>
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-sand/40">
              <span className="text-charcoal/60">Storage Engine:</span>
              <span className="font-semibold text-charcoal">
                {status?.supabase?.storage_mode || 'Persistent Local Fallback'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-sand/40">
              <span className="text-charcoal/60">Supabase Endpoint:</span>
              <span className="font-mono text-charcoal truncate max-w-[200px]">
                {status?.supabase?.url || 'Using local file store'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-charcoal/60">Webhook Automation:</span>
              <span className="font-medium text-sage">Active (Idempotent Handler)</span>
            </div>
          </div>

          <div className="p-3 rounded bg-ivory border border-sand text-xs text-charcoal/70 leading-relaxed">
            <span className="font-semibold text-charcoal block mb-0.5">Dual-Persistence Architecture:</span>
            When Supabase credentials are provided in <code className="font-mono text-terracotta">.env</code>, MeetMind AI synchronizes with PostgreSQL tables. When not present, it automatically uses the local store, preserving all records across restarts.
          </div>
        </div>
      </div>

      {/* Environment Configuration Guide */}
      <div className="bg-white border border-sand rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl text-charcoal">Configuration Template (.env)</h3>
            <p className="text-xs text-charcoal/60">
              Copy these variables into your root <code className="font-mono">.env</code> file with your personal credentials.
            </p>
          </div>
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded border border-sand bg-ivory hover:bg-sand/40 text-xs font-semibold text-charcoal transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-sage" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Template</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 rounded-lg bg-charcoal text-ivory text-xs font-mono overflow-x-auto leading-relaxed">
          {sampleEnv}
        </pre>
      </div>
    </div>
  );
};
