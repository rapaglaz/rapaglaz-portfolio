import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { FeatureFlagService } from '@rapaglaz/shared/data-access';
import { Badge } from '@rapaglaz/shared/ui';

@Component({
  selector: 'app-hero',
  imports: [NgOptimizedImage, TranslocoModule, Badge],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero {
  protected readonly avatarImage = './images/IMG_2290-384.webp';
  protected readonly openToWork = inject(FeatureFlagService).getFlagValue('openToWork');
}
