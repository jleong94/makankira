/**
 * http.ts — request/response helpers for Vercel Node functions (req, res model).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

/** An error carrying an HTTP status and a stable machine code. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function sendJson(res: VercelResponse, status: number, body: unknown): void {
  res.status(status).json(body);
}

export function sendError(res: VercelResponse, err: unknown): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  console.error('Unhandled API error:', err);
  res.status(500).json({ error: { code: 'internal_error', message: 'Internal server error' } });
}

export type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void> | void;

/** Wrap a handler so thrown HttpErrors (and anything else) become JSON errors. */
export function withErrors(handler: Handler): Handler {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      sendError(res, err);
    }
  };
}

/** Restrict to the given HTTP methods; throws 405 otherwise. */
export function allow(req: VercelRequest, methods: string[]): void {
  if (!methods.includes(req.method ?? '')) {
    throw new HttpError(405, 'method_not_allowed', `Method ${req.method ?? '?'} not allowed`);
  }
}

/**
 * CSRF defense-in-depth: for state-changing methods, require the browser Origin
 * (when present) to match the request host. Non-browser clients send no Origin.
 */
export function assertSameOrigin(req: VercelRequest): void {
  const method = req.method ?? 'GET';
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return;
  const origin = req.headers.origin;
  if (!origin) return;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new HttpError(403, 'bad_origin', 'Invalid Origin header');
  }
  if (originHost !== req.headers.host) {
    throw new HttpError(403, 'bad_origin', 'Cross-origin request rejected');
  }
}

/** Parse the JSON request body into a plain object (Vercel pre-parses JSON). */
export function bodyObject(req: VercelRequest): Record<string, unknown> {
  const b = req.body;
  if (b && typeof b === 'object' && !Array.isArray(b)) return b as Record<string, unknown>;
  if (typeof b === 'string' && b.length > 0) {
    try {
      const parsed: unknown = JSON.parse(b);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      /* fall through to empty */
    }
  }
  return {};
}

/** Read a required non-empty string field from a body object. */
export function requireString(body: Record<string, unknown>, key: string): string {
  const v = body[key];
  if (typeof v !== 'string' || v.length === 0) {
    throw new HttpError(400, 'invalid_request', `Field "${key}" is required`);
  }
  return v;
}
