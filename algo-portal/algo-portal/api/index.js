// Vercel serverless entrypoint. Because this file lives in /api at the project root,
// Vercel auto-detects it as a serverless function with zero configuration needed —
// no vercel.json, no custom Root Directory setting.
import 'dotenv/config';
import app from '../lib/app.js';

export default app;
