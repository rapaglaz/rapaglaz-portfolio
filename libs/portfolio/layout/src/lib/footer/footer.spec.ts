import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { provideTranslocoTesting } from '@rapaglaz/shared/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { Footer } from './footer';

describe('Footer', () => {
  let fixture: ComponentFixture<Footer>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [provideTranslocoTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Footer);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('shows the current year and the name', async () => {
    await firstValueFrom(TestBed.inject(TranslocoService).load('en'));
    await fixture.whenStable();
    const text = element.querySelector('footer')?.textContent?.replace(/\s+/g, ' ');

    expect(text).toContain(`© ${new Date().getFullYear()} Radek Glaz`);
  });

  it('has no actions, because the contact section above lists them', () => {
    expect(element.querySelectorAll('a, button')).toHaveLength(0);
  });
});
