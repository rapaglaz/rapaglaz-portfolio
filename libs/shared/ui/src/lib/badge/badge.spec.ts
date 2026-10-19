import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Badge } from './badge';

describe('Badge', () => {
  let fixture: ComponentFixture<Badge>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Badge],
    }).compileComponents();

    fixture = TestBed.createComponent(Badge);
    compiled = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('does not set aria-label when none is provided', () => {
    expect(compiled.getAttribute('aria-label')).toBeNull();
  });

  it('sets aria-label when provided', () => {
    fixture.componentRef.setInput('ariaLabel', 'Open to Work');
    fixture.detectChanges();

    expect(compiled.getAttribute('aria-label')).toBe('Open to Work');
  });

  it('applies size classes for sm, lg, xl', () => {
    // default is md
    expect(compiled.className).toContain('px-3');
    expect(compiled.className).toContain('py-1');
    expect(compiled.className).toContain('text-sm');

    fixture.componentRef.setInput('badgeSize', 'sm');
    fixture.detectChanges();
    expect(compiled.className).toContain('px-2.5');
    expect(compiled.className).toContain('text-xs');

    fixture.componentRef.setInput('badgeSize', 'lg');
    fixture.detectChanges();
    expect(compiled.className).toContain('px-4');
    expect(compiled.className).toContain('py-2');
    expect(compiled.className).toContain('text-base');

    fixture.componentRef.setInput('badgeSize', 'xl');
    fixture.detectChanges();
    expect(compiled.className).toContain('px-5');
    expect(compiled.className).toContain('py-2.5');
    expect(compiled.className).toContain('text-lg');
  });
});
