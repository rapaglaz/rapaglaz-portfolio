import { ScrollDispatcher } from '@angular/cdk/scrolling';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { finalize, map, startWith } from 'rxjs';
import { CONTACT_ITEMS } from '../../content';
import { CvDownloadService, FeatureFlagService, LoggerService, ToastService } from '../../services';
import { Badge } from '../../ui';
import { withErrorToast } from '../../utils/rxjs';
import { LanguageSwitcher } from '../language-switcher/language-switcher';

@Component({
  selector: 'app-navbar',
  imports: [Badge, LanguageSwitcher, TranslocoModule],
  templateUrl: './navbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  private readonly navbarRef = viewChild.required<ElementRef<HTMLElement>>('navbar');

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

  private readonly openToWorkFlag = this.featureFlagService.getFlagSignal('openToWork');

  protected readonly isScrolled = computed(() => this.scrollY() > 0);
  protected readonly isDownloading = signal(false);
  protected readonly canDownload = computed(() => !this.isDownloading());
  protected readonly openToWork = this.openToWorkFlag.flag;
  protected readonly isFeatureFlagLoaded = this.openToWorkFlag.isLoaded;

  constructor() {
    afterNextRender(() => {
      const navbar = this.navbarRef().nativeElement;
      const rootStyle = this.document.documentElement.style;
      const updateHeight = (): void => {
        const height = navbar.getBoundingClientRect().height;
        rootStyle.setProperty('--navbar-height', `${height}px`);
      };

      updateHeight();

      if (typeof ResizeObserver === 'undefined') {
        return;
      }

      let debounceTimer: ReturnType<typeof setTimeout> | undefined;
      const debouncedUpdate = (): void => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(updateHeight, 100);
      };

      const resizeObserver = new ResizeObserver(debouncedUpdate);
      resizeObserver.observe(navbar);
      this.destroyRef.onDestroy(() => {
        clearTimeout(debounceTimer);
        resizeObserver.disconnect();
      });
    });
  }

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
        withErrorToast(this.toastService, 'portfolio.cv.error', this.translocoService),
        finalize(() => this.isDownloading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
