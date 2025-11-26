import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { Hero } from './hero';

describe('Hero', () => {
  let fixture: ComponentFixture<Hero>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hero],
      providers: [provideTranslocoTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Hero);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('renders hero section without errors', () => {
    const section = element.querySelector('section#hero');

    expect(section).toBeTruthy();
  });
});
