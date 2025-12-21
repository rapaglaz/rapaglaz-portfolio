import { ScrollDispatcher } from '@angular/cdk/scrolling';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { finalize, map, startWith } from 'rxjs';
import { CONTACT_ITEMS } from '../../content';
import { CvDownloadService, FeatureFlagService, ToastService } from '../../services';
import { Badge, ButtonDirective } from '../../ui';
import { withErrorToast } from '../../utils/rxjs';
import { LanguageSwitcher } from '../language-switcher/language-switcher';

@Component({
  selector: 'app-navbar',
  imports: [ButtonDirective, Badge, LanguageSwitcher, TranslocoModule],
  templateUrl: './navbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  private readonly scrollDispatcher = inject(ScrollDispatcher);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cvDownloadService = inject(CvDownloadService);
  private readonly toastService = inject(ToastService);
  private readonly translocoService = inject(TranslocoService);
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

  protected readonly isScrolled = computed(() => this.scrollY() > 0);
  protected readonly isDownloading = signal(false);
  protected readonly canDownload = computed(() => !this.isDownloading());
  protected readonly openToWork = toSignal(this.featureFlagService.getFlag$('openToWork'));
  protected readonly isFeatureFlagLoaded = computed(() => this.openToWork() !== null);

  contactEmail(): void {
    const emailItem = CONTACT_ITEMS.find(item => item.id === 'email');
    if (emailItem) {
      if (!isPlatformBrowser(this.platformId)) return;
      this.document.defaultView?.location.assign(emailItem.href);
    }
  }

  protected handleDownloadCV(): void {
    if (!this.canDownload()) return;

    this.isDownloading.set(true);

    this.cvDownloadService
      .downloadCV()
      .pipe(
        withErrorToast(this.toastService, 'portfolio.cv.error', this.translocoService),
        finalize(() => this.isDownloading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
