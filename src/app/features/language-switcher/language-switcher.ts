import { CdkListboxModule, type ListboxValueChangeEvent } from '@angular/cdk/listbox';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { AVAILABLE_LANGS, isAvailableLang, LANG_LABELS } from '../../utils/i18n';

@Component({
  selector: 'app-language-switcher',
  imports: [CdkListboxModule],
  template: `
    <div
      class="group flex items-center gap-x-1.5 md:gap-x-0.5"
      cdkListbox
      [cdkListboxValue]="selectedLang()"
      (cdkListboxValueChange)="handleValueChange($event)"
      aria-label="Language selection">
      @for (lang of availableLangs; track lang; let last = $last) {
        <button
          type="button"
          [cdkOption]="lang"
          [class]="getLangClasses(lang)"
          [attr.aria-label]="getLangLabel(lang)">
          {{ lang.toUpperCase() }}
        </button>
        @if (!last) {
          <span
            class="text-base-content/70 select-none"
            aria-hidden="true">
            /
          </span>
        }
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcher {
  private readonly translocoService = inject(TranslocoService);
  private readonly router = inject(Router);

  protected readonly availableLangs = AVAILABLE_LANGS;

  protected readonly currentLang = toSignal(this.translocoService.langChanges$, {
    initialValue: this.translocoService.getActiveLang(),
  });

  protected readonly selectedLang = computed<readonly string[]>(() => [this.currentLang()]);

  protected handleValueChange(event: ListboxValueChangeEvent<string>): void {
    const next = event.value[0];
    if (next) {
      this.changeLang(next);
    }
  }

  protected changeLang(lang: string): void {
    if (!isAvailableLang(lang)) {
      return;
    }

    const { fragment } = this.router.parseUrl(this.router.url);
    this.translocoService.setActiveLang(lang);
    void this.router.navigate(['/', lang], { fragment: fragment ?? undefined });
  }

  protected getLangLabel(lang: string): string {
    if (isAvailableLang(lang)) {
      return LANG_LABELS[lang];
    }
    return lang;
  }

  protected getLangClasses(lang: string): string {
    const baseClasses =
      'btn btn-link text-shadow-xs text-shadow-primary text-xl md:text-lg transition-all duration-400 no-underline px-1.5 inline-flex items-center justify-center';
    const isActive = this.currentLang() === lang;
    const stateClasses = isActive
      ? 'text-primary dark:text-primary/80 scale-110 font-bold pointer-events-none cursor-default'
      : 'text-primary dark:text-base-content/80 hover:text-primary hover:cursor-pointer hover:scale-105 hover:font-bold';
    return `${baseClasses} ${stateClasses}`;
  }
}
