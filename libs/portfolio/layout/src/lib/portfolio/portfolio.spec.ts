import { DOCUMENT } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, PLATFORM_ID, signal, type Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { FeatureFlagService } from '@rapaglaz/shared/data-access';
import { provideTranslocoTesting } from '@rapaglaz/shared/testing';
import { describe, expect, it, vi } from 'vitest';
import { Portfolio } from './portfolio';

// Stands in for the lazy page, which owns #main-content
@Component({
  template: `<main
    id="main-content"
    tabindex="-1"></main>`,
})
class Page {}

async function setup(platformId = 'browser', url = '/'): Promise<ComponentFixture<Portfolio>> {
  TestBed.configureTestingModule({
    imports: [Portfolio],
    providers: [
      provideRouter([
        { path: 'error', component: Page, data: { hideNavbar: true } },
        { path: '**', component: Page },
      ]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTranslocoTesting(),
      { provide: PLATFORM_ID, useValue: platformId },
      // the real flag starts an HTTP request that keeps the fixture unstable
      {
        provide: FeatureFlagService,
        useValue: { getFlagValue: (): Signal<boolean> => signal(false) },
      },
    ],
  });
  const fixture = TestBed.createComponent(Portfolio);
  await TestBed.inject(Router).navigateByUrl(url);
  fixture.detectChanges();
  return fixture;
}

describe('Portfolio', () => {
  it('puts the skip link first and the page between navbar and footer', async () => {
    const element = (await setup()).nativeElement as HTMLElement;
    const children = Array.from(element.children, child => child.tagName.toLowerCase());

    expect(children).toEqual(['a', 'app-navbar', 'div', 'app-footer']);
    expect(
      element.querySelector('div > router-outlet + *')?.querySelector('#main-content'),
    ).not.toBeNull();
  });

  it('hides the navbar on a route that asks for it and keeps the rest of the shell', async () => {
    const element = (await setup('browser', '/error')).nativeElement as HTMLElement;

    expect(element.querySelector('app-navbar')).toBeNull();
    expect(Array.from(element.children, child => child.tagName.toLowerCase())).toEqual([
      'a',
      'div',
      'app-footer',
    ]);
  });

  it('shows the navbar again when the visitor leaves such a route', async () => {
    const fixture = await setup('browser', '/error');
    const element = fixture.nativeElement as HTMLElement;

    await TestBed.inject(Router).navigateByUrl('/');
    fixture.detectChanges();

    expect(element.querySelector('app-navbar')).not.toBeNull();
  });

  it('moves focus to the main content on a plain click', async () => {
    const element = (await setup()).nativeElement as HTMLElement;
    const main = element.querySelector<HTMLElement>('#main-content');
    if (!main) throw new Error('Main content was not rendered');
    main.scrollIntoView = vi.fn();

    element.querySelector<HTMLAnchorElement>('a')?.click();

    expect(TestBed.inject(DOCUMENT).activeElement).toBe(main);
    expect(main.scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'instant' });
  });

  it('leaves focus alone during server rendering', async () => {
    const element = (await setup('server')).nativeElement as HTMLElement;
    const main = element.querySelector<HTMLElement>('#main-content');
    if (!main) throw new Error('Main content was not rendered');
    main.scrollIntoView = vi.fn();

    element.querySelector<HTMLAnchorElement>('a')?.click();

    expect(main.scrollIntoView).not.toHaveBeenCalled();
  });
});
