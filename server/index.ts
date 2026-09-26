import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { validateStudyDeckResult } from '../src/lib/validateResult';
import type { GenerationRequest } from '../src/types/result';
import { generateStudyDeck } from './generate';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health / Status endpoint to notify frontend whether real Gemini key is active
app.get('/api/health', (_req: Request, res: Response) => {
  const hasKey = Boolean(
    process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.trim() !== '' &&
      process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
  );

  res.json({
    status: 'ok',
    hasApiKey: hasKey,
    provider: hasKey ? 'Google Gemini 1.5 Flash' : 'Demo & Mock AI Engine',
    uptimeSeconds: process.uptime(),
  });
});

// Main AI Generation Proxy endpoint
app.post('/api/generate', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const body = req.body as GenerationRequest;

  if (!body || typeof body.prompt !== 'string' || !body.prompt.trim()) {
    res.status(400).json({
      success: false,
      error: {
        code: 'EMPTY_RESPONSE',
        message: 'No study text or prompt was provided in the request.',
      },
    });
    return;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const rawResult = await generateStudyDeck(body, apiKey);

    // If simulating malformed JSON or wrong shape, return raw output with error or invalid structure
    if (body.simulateError === 'malformed') {
      // Intentionally return malformed JSON string
      res.json({
        success: true,
        raw: rawResult, // This will be passed to frontend validator which will catch the syntax error
      });
      return;
    }

    if (body.simulateError === 'wrong-shape') {
      res.json({
        success: true,
        raw: rawResult, // This is valid JSON but misses cards array
      });
      return;
    }

    if (body.simulateError === 'empty') {
      res.json({
        success: true,
        raw: '   ',
      });
      return;
    }

    // Server-side parsing & validation check
    const validation = validateStudyDeckResult(rawResult);

    if (!validation.success) {
      res.status(422).json({
        success: false,
        error: {
          code: validation.code,
          message: validation.message,
          rawSnippet: validation.rawSnippet,
          details: validation.details,
        },
      });
      return;
    }

    const duration = Date.now() - startTime;
    res.json({
      success: true,
      data: validation.data,
      metadata: {
        provider: apiKey ? 'gemini' : 'mock-ai',
        model: apiKey ? 'gemini-1.5-flash' : 'mock-active-recall-v1',
        generationTimeMs: duration,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[API Proxy Error]:', message);

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'The AI generation backend encountered an unexpected error.',
        details: message,
      },
    });
  }
});

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` Study Assistant Backend Proxy running`);
  console.log(` Port: http://localhost:${PORT}`);
  console.log(` Gemini Key Configured: ${Boolean(process.env.GEMINI_API_KEY)}`);
  console.log(`=========================================`);
});
