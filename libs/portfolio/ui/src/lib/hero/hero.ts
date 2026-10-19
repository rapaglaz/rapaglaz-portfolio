import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { Badge } from '@rapaglaz/shared/ui';

@Component({
  selector: 'app-hero',
  imports: [NgOptimizedImage, TranslocoModule, Badge],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero {
  readonly openToWork = input(false);

  protected readonly avatarImage = './images/IMG_2290-384.webp';
}
