import { ScrollDispatcher } from '@angular/cdk/scrolling';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, computed, DestroyRef, inject, PLATFORM_ID, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { cvFileName, injectContactEmailOpener } from '@rapaglaz/portfolio/util';
import { FeatureFlagService, ProtectedDownloadService } from '@rapaglaz/shared/data-access';
import { Badge, ToastService } from '@rapaglaz/shared/ui';
import { DEFAULT_LANG, isAvailableLang, LoggerService } from '@rapaglaz/shared/util';
import { finalize, map, startWith } from 'rxjs';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { MeasureNavbarHeightDirective } from './measure-navbar-height.directive';
import { withErrorToast } from './with-error-toast.operator';

@Component({
  selector: 'app-navbar',
  imports: [Badge, LanguageSwitcher, MeasureNavbarHeightDirective, TranslocoModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private readonly scrollDispatcher = inject(ScrollDispatcher);
  private readonly destroyRef = inject(DestroyRef);
  private readonly downloadService = inject(ProtectedDownloadService);
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

  protected readonly isScrolled = computed(() => this.scrollY() > 0);
  protected readonly isDownloading = signal(false);
  protected readonly canDownload = computed(() => !this.isDownloading());
  protected readonly openToWork = this.featureFlagService.getFlagValue('openToWork');
  protected readonly contactEmail = injectContactEmailOpener();

  protected handleDownloadCV(trigger: HTMLButtonElement): void {
    if (!this.canDownload()) return;

    if (isPlatformBrowser(this.platformId)) {
      trigger.focus({ preventScroll: true });
    }
    this.isDownloading.set(true);

    const lang = this.translocoService.getActiveLang();
    this.downloadService
      .download(cvFileName(isAvailableLang(lang) ? lang : DEFAULT_LANG), trigger)
      .pipe(
        /** t(portfolio.cv.error) */
        withErrorToast('portfolio.cv.error', this.toastService, this.translocoService, this.logger),
        finalize(() => this.isDownloading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
