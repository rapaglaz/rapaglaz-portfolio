import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { BehaviorSubject } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { injectActiveLang } from './active-lang';

// shared-testing imports this library, so the spec stubs TranslocoService instead
describe('injectActiveLang', () => {
  it('follows the active language', () => {
    const langChanges$ = new BehaviorSubject('en');
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TranslocoService,
          useValue: { langChanges$, getActiveLang: (): string => langChanges$.value },
        },
      ],
    });
    const activeLang = TestBed.runInInjectionContext(injectActiveLang);

    expect(activeLang()).toBe('en');
    langChanges$.next('de');
    expect(activeLang()).toBe('de');
  });
});
