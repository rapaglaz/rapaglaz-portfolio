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
  private readonly navbarRef = viewChild.required<ElementRef<HTMLElement>>('navbar');

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

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) return;

      const navbar = this.navbarRef().nativeElement;
      const rootStyle = this.document.documentElement.style;
      const updateHeight = (): void => {
        const height = navbar.getBoundingClientRect().height;
        rootStyle.setProperty('--navbar-height', `${height}px`);
      };

      updateHeight();

      const resizeObserver = new ResizeObserver(updateHeight);
      resizeObserver.observe(navbar);
      this.destroyRef.onDestroy(() => resizeObserver.disconnect());
    });
  }

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
