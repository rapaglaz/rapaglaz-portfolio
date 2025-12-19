import { CdkListboxModule, type ListboxValueChangeEvent } from '@angular/cdk/listbox';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { LoggerService } from '../../services';
import { getBrowserLanguage, isAvailableLang, LANG_LABELS } from '../../utils/i18n';

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
      @for (lang of availableLanguages(); track lang; let last = $last) {
        <button
          type="button"
          [cdkOption]="lang"
          [class]="getLangClasses(lang)"
          [attr.aria-label]="getLangLabel(lang)">
          {{ lang.toUpperCase() }}
        </button>
        @if (!last) {
          <span
            class="text-base-content select-none"
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
  private readonly loggerService = inject(LoggerService);

  protected readonly availableLangs = this.translocoService.getAvailableLangs() as string[];

  protected readonly currentLang = toSignal(this.translocoService.langChanges$, {
    initialValue: getBrowserLanguage(this.loggerService),
  });

  protected readonly selectedLang = computed<readonly string[]>(() => [this.currentLang()]);

  protected handleValueChange(event: ListboxValueChangeEvent<string>): void {
    const next = event.value[0];
    if (typeof next === 'string' && next) {
      this.changeLang(next);
    }
  }

  protected availableLanguages(): string[] {
    const browserLang = getBrowserLanguage(this.loggerService).split('-')[0];
    if (this.availableLangs.includes(browserLang)) {
      return [browserLang, ...this.availableLangs.filter(lang => lang !== browserLang)];
    }
    return this.availableLangs;
  }

  protected changeLang(lang: string): void {
    this.translocoService.setActiveLang(lang);
  }

  protected getLangLabel(lang: string): string {
    if (isAvailableLang(lang)) {
      return LANG_LABELS[lang];
    }
    return lang;
  }

  protected getLangClasses(lang: string): string {
    const baseClasses =
      'btn btn-link btn-sm text-base transition-all duration-200 no-underline p-0 min-h-0 h-auto w-8 inline-flex items-center justify-center';
    const isActive = this.currentLang() === lang;
    const stateClasses = isActive
      ? 'text-primary font-bold pointer-events-none cursor-default'
      : 'text-base-content font-normal hover:text-primary cursor-pointer';
    return `${baseClasses} ${stateClasses}`;
  }
}
