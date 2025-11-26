import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { About } from './about';

describe('About', () => {
  let fixture: ComponentFixture<About>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [About],
      providers: [provideTranslocoTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(About);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('renders about section', () => {
    const section = element.querySelector('section#about');
    expect(section).toBeTruthy();
  });
});
