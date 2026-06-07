import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { FeatureFlagService } from '../../services';
import { Badge } from '../../ui';

@Component({
  selector: 'app-hero',
  imports: [NgOptimizedImage, TranslocoModule, Badge],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero {
  private readonly featureFlagService = inject(FeatureFlagService);
  private readonly openToWorkFlag = this.featureFlagService.getFlagSignal('openToWork');

  protected readonly avatarImage = './images/IMG_2290-384.webp';
  protected readonly openToWork = this.openToWorkFlag.flag;
  protected readonly isFeatureFlagLoaded = this.openToWorkFlag.isLoaded;
}
