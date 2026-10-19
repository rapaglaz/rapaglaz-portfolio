import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { API_BASE_URL, API_FEATURE_FLAG_URL } from './api-urls.token';

describe('API URL tokens', () => {
  it.each([
    ['localhost', 'https://rapaglaz.de'],
    ['127.0.0.1', 'https://rapaglaz.de'],
    ['rapaglaz.github.io', 'https://rapaglaz.de'],
    ['rapaglaz.de', ''],
    ['preview.example.com', ''],
  ])('uses the expected API base for %s', (hostname, expected) => {
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: { defaultView: { location: { hostname } } } }],
    });

    expect(TestBed.inject(API_BASE_URL)).toBe(expected);
    expect(TestBed.inject(API_FEATURE_FLAG_URL)).toBe('https://rapaglaz.de/feature-flag');
  });

  it('uses relative API paths when the document has no window', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: { defaultView: null } }],
    });

    expect(TestBed.inject(API_BASE_URL)).toBe('');
    expect(TestBed.inject(API_FEATURE_FLAG_URL)).toBe('https://rapaglaz.de/feature-flag');
  });
});
