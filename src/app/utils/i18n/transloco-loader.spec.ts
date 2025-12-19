import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import deJson from '../../../../public/i18n/de.json';
import enJson from '../../../../public/i18n/en.json';
import { TranslocoHttpLoader } from './transloco-loader';

describe('TranslocoHttpLoader', () => {
  let loader: TranslocoHttpLoader;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TranslocoHttpLoader, provideHttpClient(), provideHttpClientTesting()],
    });

    loader = TestBed.inject(TranslocoHttpLoader);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads actual en.json file', () => {
    let receivedTranslation: any;

    loader.getTranslation('en').subscribe({
      next: translation => {
        receivedTranslation = translation;
      },
    });

    const req = httpMock.expectOne('/i18n/en.json');
    expect(req.request.method).toBe('GET');
    req.flush(enJson);

    expect(receivedTranslation).toBeDefined();
    expect(typeof receivedTranslation).toBe('object');
    expect(receivedTranslation).toEqual(enJson);
  });

  it('loads actual de.json file', () => {
    let receivedTranslation: any;

    loader.getTranslation('de').subscribe({
      next: translation => {
        receivedTranslation = translation;
      },
    });

    const req = httpMock.expectOne('/i18n/de.json');
    expect(req.request.method).toBe('GET');
    req.flush(deJson);

    expect(receivedTranslation).toBeDefined();
    expect(typeof receivedTranslation).toBe('object');
    expect(receivedTranslation).toEqual(deJson);
  });

  it('handles HTTP 404 errors', () => {
    let receivedError: any;

    loader.getTranslation('en').subscribe({
      error: error => {
        receivedError = error;
      },
    });

    const req = httpMock.expectOne('/i18n/en.json');
    req.error(new ProgressEvent('error'), { status: 404, statusText: 'Not Found' });

    expect(receivedError).toBeDefined();
  });

  it('handles network errors', () => {
    let receivedError: any;

    loader.getTranslation('en').subscribe({
      error: error => {
        receivedError = error;
      },
    });

    const req = httpMock.expectOne('/i18n/en.json');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Network error' });

    expect(receivedError).toBeDefined();
  });
});
