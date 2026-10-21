import { CdkListboxModule, type ListboxValueChangeEvent } from '@angular/cdk/listbox';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  AVAILABLE_LANGS,
  injectActiveLang,
  isAvailableLang,
  LANG_LABELS,
} from '@rapaglaz/shared/util';

const BASE_CLASSES =
  'btn btn-link text-shadow-primary-xs text-xl md:text-lg transition-all duration-400 no-underline px-1.5';
const ACTIVE_CLASSES =
  'text-primary dark:text-primary/80 font-extrabold dark:font-bold pointer-events-none cursor-default';
const INACTIVE_CLASSES =
  'text-primary/90 dark:text-base-content/80 hover:text-primary hover:scale-115 font-semibold hover:cursor-pointer hover:text-shadow-primary';

function langClasses(active: boolean): string {
  return `${BASE_CLASSES} ${active ? ACTIVE_CLASSES : INACTIVE_CLASSES}`;
}

@Component({
  selector: 'app-language-switcher',
  imports: [CdkListboxModule, TranslocoPipe],
  template: `
    <div
      class="group flex items-center gap-x-1.5 md:gap-x-0.5"
      cdkListbox
      cdkListboxOrientation="horizontal"
      [cdkListboxValue]="selectedLang()"
      (cdkListboxValueChange)="handleValueChange($event)"
      [attr.aria-label]="'common.a11y.languageSelection' | transloco">
      @for (option of options(); track option.lang; let last = $last) {
        <button
          type="button"
          [cdkOption]="option.lang"
          [attr.lang]="option.lang"
          [class]="option.classes"
          [attr.aria-label]="option.label">
          {{ option.code }}
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
})
export class LanguageSwitcher {
  private readonly router = inject(Router);

  protected readonly currentLang = injectActiveLang();

  protected readonly selectedLang = computed<readonly string[]>(() => [this.currentLang()]);

  protected readonly options = computed(() =>
    AVAILABLE_LANGS.map(lang => ({
      lang,
      code: lang.toUpperCase(),
      label: `${lang.toUpperCase()} ${LANG_LABELS[lang]}`,
      classes: langClasses(lang === this.currentLang()),
    })),
  );

  protected handleValueChange(event: ListboxValueChangeEvent<string>): void {
    const next = event.value[0];
    event.listbox.value = this.selectedLang();
    if (next) {
      this.changeLang(next);
    }
  }

  protected changeLang(lang: string): void {
    if (!isAvailableLang(lang)) {
      return;
    }

    const { fragment } = this.router.parseUrl(this.router.url);
    void this.router.navigate(['/', lang], {
      fragment: fragment ?? undefined,
      queryParamsHandling: 'preserve',
    });
  }
}
