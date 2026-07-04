import { ScrollDispatcher } from '@angular/cdk/scrolling';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, computed, DestroyRef, inject, PLATFORM_ID, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { finalize, map, startWith } from 'rxjs';
import { CONTACT_ITEMS } from '../../content';
import { CvDownloadService, FeatureFlagService, LoggerService, ToastService } from '../../services';
import { Badge } from '../../ui';
import { MeasureNavbarHeightDirective } from '../../utils/layout';
import { withErrorToast } from '../../utils/rxjs';
import { LanguageSwitcher } from '../language-switcher/language-switcher';

@Component({
  selector: 'app-navbar',
  imports: [Badge, LanguageSwitcher, MeasureNavbarHeightDirective, TranslocoModule],
  templateUrl: './navbar.html',
})
export class Navbar {
  private readonly scrollDispatcher = inject(ScrollDispatcher);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cvDownloadService = inject(CvDownloadService);
  private readonly toastService = inject(ToastService);
  private readonly translocoService = inject(TranslocoService);
  private readonly logger = inject(LoggerService);
  private readonly featureFlagService = inject(FeatureFlagService);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly scrollY = toSignal(
    this.scrollDispatcher.scrolled(0).pipe(
      startWith(null),
      map(() => {
        if (!isPlatformBrowser(this.platformId)) {
          return 0;
        }
        const win = this.document.defaultView;
        return win ? win.scrollY || 0 : 0;
      }),
    ),
    { initialValue: 0 },
  );

  private readonly openToWorkFlag = this.featureFlagService.getFlag('openToWork');

  protected readonly isScrolled = computed(() => this.scrollY() > 0);
  protected readonly isDownloading = signal(false);
  protected readonly canDownload = computed(() => !this.isDownloading());
  // hasValue() guards value(), which throws while the resource is in the error state.
  protected readonly openToWork = computed(
    () => this.openToWorkFlag.hasValue() && this.openToWorkFlag.value(),
  );

  protected contactEmail(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const href = CONTACT_ITEMS.find(item => item.id === 'email')?.href;
    if (!href) return;
    this.document.defaultView?.location.assign(href);
  }

  protected handleDownloadCV(): void {
    if (!this.canDownload()) return;

    this.isDownloading.set(true);

    this.cvDownloadService
      .downloadCV()
      .pipe(
        withErrorToast('portfolio.cv.error', this.toastService, this.translocoService, this.logger),
        finalize(() => this.isDownloading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
