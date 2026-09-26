import { generateStudyDeck } from '../server/generate';
import { validateStudyDeckResult } from '../src/lib/validateResult';
import type { GenerationRequest } from '../src/types/result';

export default async function handler(req: any, res: any) {
  // CORS support
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const startTime = Date.now();
  const body = req.body as GenerationRequest;

  if (!body || typeof body.prompt !== 'string' || !body.prompt.trim()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'EMPTY_RESPONSE',
        message: 'No study text or prompt was provided in the request.',
      },
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const rawResult = await generateStudyDeck(body, apiKey);

    // Intentional failure simulation checks
    if (body.simulateError === 'malformed') {
      return res.status(200).json({ success: true, raw: rawResult });
    }
    if (body.simulateError === 'wrong-shape') {
      return res.status(200).json({ success: true, raw: rawResult });
    }
    if (body.simulateError === 'empty') {
      return res.status(200).json({ success: true, raw: '   ' });
    }

    const validation = validateStudyDeckResult(rawResult);
    if (!validation.success) {
      return res.status(422).json({
        success: false,
        error: {
          code: validation.code,
          message: validation.message,
          rawSnippet: validation.rawSnippet,
          details: validation.details,
        },
      });
    }

    const duration = Date.now() - startTime;
    return res.status(200).json({
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
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'The AI generation backend encountered an unexpected error.',
        details: message,
      },
    });
  }
}
