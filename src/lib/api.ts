import type { ApiResponse, GenerationRequest, StudyDeckResult } from '../types/result';
import { validateStudyDeckResult } from './validateResult';

/**
 * Timeout in milliseconds before an AI generation request is cancelled.
 * Prevents requests from hanging indefinitely.
 */
const REQUEST_TIMEOUT_MS = 25000;

export interface CallApiOptions {
  signal?: AbortSignal;
  onSlowResponseWarning?: () => void;
}

/**
 * API client proxy that communicates with the backend server.
 * Ensures the browser NEVER talks directly to the LLM or holds API keys.
 * Also executes client-side shape validation as a second line of defense.
 */
export async function callBackendApi(
  payload: GenerationRequest,
  options?: CallApiOptions
): Promise<ApiResponse> {
  const controller = new AbortController();

  // Combine user signal with timeout signal
  const timeoutId = setTimeout(() => {
    controller.abort('TIMEOUT');
  }, REQUEST_TIMEOUT_MS);

  if (options?.signal) {
    options.signal.addEventListener('abort', () => {
      controller.abort(options.signal?.reason || 'USER_ABORT');
    });
  }

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const json = await res.json();

    // If backend intentionally returned raw string for simulation testing:
    if (json.raw !== undefined) {
      const clientValidation = validateStudyDeckResult(json.raw);
      if (!clientValidation.success) {
        return {
          success: false,
          error: {
            code: clientValidation.code,
            message: clientValidation.message,
            rawSnippet: clientValidation.rawSnippet,
            details: clientValidation.details,
          },
        };
      }
      return {
        success: true,
        data: clientValidation.data,
        metadata: {
          provider: 'mock-ai',
          model: 'simulated-test',
          generationTimeMs: 150,
        },
      };
    }

    if (!res.ok) {
      return {
        success: false,
        error: json.error || {
          code: 'SERVER_ERROR',
          message: `Server returned HTTP status ${res.status}`,
          details: json.message || res.statusText,
        },
      };
    }

    // Double-check shape validation on client side
    const validated = validateStudyDeckResult(json.data);
    if (!validated.success) {
      return {
        success: false,
        error: {
          code: validated.code,
          message: validated.message,
          rawSnippet: validated.rawSnippet,
          details: validated.details,
        },
      };
    }

    return {
      success: true,
      data: validated.data as StudyDeckResult,
      metadata: json.metadata,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err === 'TIMEOUT' || (err instanceof DOMException && err.name === 'AbortError' && controller.signal.reason === 'TIMEOUT')) {
      return {
        success: false,
        error: {
          code: 'TIMEOUT',
          message: 'The AI model took longer than 25 seconds to respond.',
          details: 'AI calls can occasionally experience high queue latency. Please retry.',
        },
      };
    }

    if (err instanceof DOMException && err.name === 'AbortError') {
      return {
        success: false,
        error: {
          code: 'STALE_REQUEST',
          message: 'Request was cancelled because a newer request was dispatched.',
        },
      };
    }

    const message = err instanceof Error ? err.message : 'Network error or backend unreachable';
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Could not connect to the backend server.',
        details: `${message}. Ensure the backend proxy is running on port 3001.`,
      },
    };
  }
}

/**
 * Checks server health and Gemini API key status.
 */
export async function checkServerHealth(): Promise<{
  status: string;
  hasApiKey: boolean;
  provider: string;
} | null> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
