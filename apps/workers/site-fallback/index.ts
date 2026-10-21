/**
 * Fallback Worker: replaces an error of the origin with a static offline page.
 * The portfolio is served from a separate web host, so its own pages cannot be shown while that
 * host is down. The Worker runs on Cloudflare and does not depend on it.
 */
import offlinePage from './offline.html';

type Language = 'en' | 'de';

type Copy = {
  title: string;
  heading: string;
  message: string;
  reload: string;
  retry: string;
};

// Seconds that a client or crawler should wait before it asks again
const RETRY_AFTER = '300';

const COPY: Record<Language, Copy> = {
  en: {
    title: 'Temporarily unavailable | rapaglaz.de',
    heading: 'Back in a moment',
    message:
      'The server behind this page does not answer right now. This is a temporary problem on my side, not something you did.',
    reload: 'Try again',
    retry: 'This page reloads itself every minute.',
  },
  de: {
    title: 'Vorübergehend nicht erreichbar | rapaglaz.de',
    heading: 'Gleich wieder da',
    message:
      'Der Server hinter dieser Seite antwortet gerade nicht. Das ist ein vorübergehendes Problem auf meiner Seite, du hast nichts falsch gemacht.',
    reload: 'Erneut versuchen',
    retry: 'Diese Seite lädt sich jede Minute selbst neu.',
  },
};

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

// The page uses only static text, never a value from the request, so nothing needs escaping
function renderPage(language: Language): string {
  const values: Record<string, string> = { lang: language, ...COPY[language] };
  return offlinePage.replace(
    /\[\[(\w+)\]\]/g,
    (placeholder, key: string) => values[key] ?? placeholder,
  );
}

function offlineResponse(request: Request): Response {
  return new Response(request.method === 'HEAD' ? null : renderPage(languageOf(request)), {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Retry-After': RETRY_AFTER,
      'X-Robots-Tag': 'noindex',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy':
        "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    },
  });
}
