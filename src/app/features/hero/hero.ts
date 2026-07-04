import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
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
  private readonly openToWorkFlag = this.featureFlagService.getFlag('openToWork');

  protected readonly avatarImage = './images/IMG_2290-384.webp';
  // hasValue() guards value(), which throws while the resource is in the error state.
  protected readonly openToWork = computed(
    () => this.openToWorkFlag.hasValue() && this.openToWorkFlag.value(),
  );
}
