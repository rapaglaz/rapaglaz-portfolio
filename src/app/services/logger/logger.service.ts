import { Injectable, isDevMode } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  info(message: string, ...optionalParams: unknown[]): void {
    if (isDevMode()) {
      console.log(`[INFO] ${message}`, ...optionalParams);
    }
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    if (isDevMode()) {
      console.warn(`[WARN] ${message}`, ...optionalParams);
    }
  }

  error(message: string, error?: unknown): void {
    console.error(`[ERROR] ${message}`, error);
  }
}
