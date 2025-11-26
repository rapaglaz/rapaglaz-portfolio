import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { Certifications } from './certifications';

describe('Certifications', () => {
  let fixture: ComponentFixture<Certifications>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Certifications],
      providers: [provideTranslocoTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Certifications);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('renders certifications section', () => {
    expect(element.querySelector('section#certifications')).toBeTruthy();
  });
});
