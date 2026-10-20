import { HttpContextToken } from '@angular/common/http';

// Set on a request that carries a Turnstile token; the interceptor turns it into the header
export const TURNSTILE_TOKEN = new HttpContextToken<string | null>(() => null);
