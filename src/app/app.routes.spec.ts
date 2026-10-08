import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { routes } from './app.routes';
import { Portfolio } from './portfolio/portfolio';
import { provideTranslocoTesting } from './testing';

describe('portfolio routes', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslocoTesting(),
      ],
    });
    await firstValueFrom(TestBed.inject(TranslocoService).load('en'));
  });

  it.each(['/', '/en', '/de'])('loads portfolio content at %s', async path => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl(path, Portfolio);

    expect(TestBed.inject(Router).url).toBe(path);
    expect(harness.routeNativeElement?.querySelector('main')).toBeInstanceOf(HTMLElement);
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Radoslaw');
  });

  it('redirects an unknown path to the root portfolio', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/unknown/page', Portfolio);

    expect(TestBed.inject(Router).url).toBe('/');
    expect(harness.routeNativeElement?.querySelector('main')).toBeInstanceOf(HTMLElement);
  });
});
