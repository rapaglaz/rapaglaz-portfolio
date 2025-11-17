import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-hero',
  imports: [NgOptimizedImage, TranslocoModule],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'hero-container',
  },
})
export class Hero {
  protected readonly avatarImage = '/images/IMG_2290-384.webp';
}
