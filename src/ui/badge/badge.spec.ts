import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Badge } from './badge';

describe('Badge', () => {
  let component: Badge;
  let fixture: ComponentFixture<Badge>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Badge],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(Badge);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('has accessible button with aria-label', () => {
    const badge = compiled.querySelector('[role="button"]');

    expect(badge).toBeTruthy();
    expect(badge?.getAttribute('aria-label')).toBe('Badge');

    fixture.componentRef.setInput('ariaLabel', 'Open to Work');
    fixture.detectChanges();

    expect(badge?.getAttribute('aria-label')).toBe('Open to Work');
  });

  it('emits clicked event on click', () => {
    const clickedSpy = vi.fn();
    component.clicked.subscribe(clickedSpy);

    compiled.click();

    expect(clickedSpy).toHaveBeenCalled();
  });
});
