import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { App } from './app';

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('renders without errors', () => {
    const outlet = element.querySelector('router-outlet');

    expect(outlet).toBeInstanceOf(HTMLElement);
  });
});
