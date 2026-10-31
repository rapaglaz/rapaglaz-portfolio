import { NgOptimizedImage } from '@angular/common';
import { Component, input, output } from '@angular/core';
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
  // The page knows the sections, so it decides where the scroll cue leads.
  readonly scrollCueClick = output();

  protected readonly avatarImage = './images/IMG_2290-384.webp';
}
