/**
 * Fallback Worker: replaces an error of the origin with a static offline page.
 * The portfolio is served from a separate web host, so its own pages cannot be shown while that
 * host is down. The Worker runs on Cloudflare and does not depend on it.
 */
import offlinePage from './offline.html';
import { RELOAD_SCRIPT } from './reload-script';

type Language = 'en' | 'de';

type Copy = {
  title: string;
  heading: string;
  message: string;
  reload: string;
};

// Seconds that a client or crawler should wait before it asks again
const RETRY_AFTER = '300';

// The page has this comment where the script belongs; Prettier does not change a comment
const SCRIPT_MARKER = '<!--script-->';

const COPY: Record<Language, Copy> = {
  en: {
    title: 'Temporarily unavailable | rapaglaz.de',
    heading: 'Back in a moment',
    message:
      'The server behind this page does not answer right now. This is a temporary problem on my side, not something you did.',
    reload: 'Try again',
  },
  de: {
    title: 'Vorübergehend nicht erreichbar | rapaglaz.de',
    heading: 'Gleich wieder da',
    message:
      'Der Server hinter dieser Seite antwortet gerade nicht. Das ist ein vorübergehendes Problem auf meiner Seite, du hast nichts falsch gemacht.',
    reload: 'Erneut versuchen',
  },
};

// The hash is the same for every request, so it is computed once per Worker instance
let scriptHash: Promise<string> | undefined;

export default {
  async fetch(request: Request): Promise<Response> {
    // Only a page view can be replaced; other methods keep the answer of the origin
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return fetch(request);
    }

    let response: Response;
    try {
      response = await fetch(request);
    } catch {
      return offlineResponse(request);
    }

    return response.status >= 500 ? offlineResponse(request) : response;
  },
};

function languageOf(request: Request): Language {
  return /^\/de(\/|$)/.test(new URL(request.url).pathname) ? 'de' : 'en';
}

// The page uses only static text, never a value from the request, so nothing needs escaping.
// The replacer functions keep a "$" in a text or in the script from being read as a pattern.
function renderPage(language: Language): string {
  const values: Record<string, string> = { lang: language, ...COPY[language] };
  return offlinePage
    .replace(/\[\[(\w+)\]\]/g, (placeholder, key: string) => values[key] ?? placeholder)
    .replace(SCRIPT_MARKER, () => `<script>${RELOAD_SCRIPT}</script>`);
}

async function sha256Base64(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return btoa(String.fromCodePoint(...new Uint8Array(digest)));
}

// Only the script of the Worker may run, and it may only ask the own address
async function contentSecurityPolicy(): Promise<string> {
  scriptHash ??= sha256Base64(RELOAD_SCRIPT);
  return [
    "default-src 'none'",
    "style-src 'unsafe-inline'",
    `script-src 'sha256-${await scriptHash}'`,
    "connect-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join('; ');
}

async function offlineResponse(request: Request): Promise<Response> {
  return new Response(request.method === 'HEAD' ? null : renderPage(languageOf(request)), {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Retry-After': RETRY_AFTER,
      'X-Robots-Tag': 'noindex',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': await contentSecurityPolicy(),
    },
  });
}
