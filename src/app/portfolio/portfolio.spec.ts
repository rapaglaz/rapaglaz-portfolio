import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTranslocoTesting } from '../../testing';
import { Portfolio } from './portfolio';

describe('Portfolio', () => {
  let fixture: ComponentFixture<Portfolio>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Portfolio],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslocoTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Portfolio);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('renders navbar', () => {
    const navbar = element.querySelector('app-navbar');
    expect(navbar).toBeTruthy();
  });

  it('renders main portfolio sections', () => {
    const main = element.querySelector('main');
    expect(main).toBeTruthy();

    const hero = main?.querySelector('app-hero');
    const about = main?.querySelector('app-about');
    const certifications = main?.querySelector('app-certifications');
    const skills = main?.querySelector('app-skills');
    const languages = main?.querySelector('app-languages');
    const contact = main?.querySelector('app-contact');

    expect(hero).toBeTruthy();
    expect(about).toBeTruthy();
    expect(certifications).toBeTruthy();
    expect(skills).toBeTruthy();
    expect(languages).toBeTruthy();
    expect(contact).toBeTruthy();
  });

  it('renders footer', () => {
    const footer = element.querySelector('app-footer');
    expect(footer).toBeTruthy();
  });
});
