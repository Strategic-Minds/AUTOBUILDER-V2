export type BrowserMode = 'headless' | 'headful';

export interface BrowserTaskInput {
  build_id: string;
  mode: BrowserMode;
  objective: string;
  start_url?: string;
  actions?: unknown[];
  preserve_session?: boolean;
  require_trace?: boolean;
}

function endpoint() {
  const value = process.env.BROWSER_WORKER_URL?.trim();
  if (!value) throw new Error('BROWSER_WORKER_URL is not configured');
  return value;
}

export async function runBrowserTask(input: BrowserTaskInput) {
  const token = process.env.BROWSER_WORKER_TOKEN?.trim();
  const response = await fetch(endpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-idempotency-key': `browser:${input.build_id}:${crypto.randomUUID()}`,
    },
    body: JSON.stringify({
      ...input,
      isolated_profile: true,
      capture_screenshots: true,
      capture_console: true,
      capture_network_errors: true,
      allow_takeover: input.mode === 'headful',
    }),
    signal: AbortSignal.timeout(55_000),
    cache: 'no-store',
  });
  const text = await response.text();
  let result: unknown = text;
  try { result = text ? JSON.parse(text) : null; } catch { /* retain text */ }
  if (!response.ok) throw new Error(`Browser Worker failed ${response.status}: ${text.slice(0, 700)}`);
  return result;
}
