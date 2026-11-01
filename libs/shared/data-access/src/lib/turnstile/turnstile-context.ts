import { HttpContextToken } from '@angular/common/http';

export const TURNSTILE_TOKEN = new HttpContextToken<string | null>(() => null);
