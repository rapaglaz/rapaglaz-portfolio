import { Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

export type ToastType = 'success' | 'error' | 'info';

export type ToastData = {
  message: string;
  type: ToastType;
};

@Component({
  selector: 'app-toast-container',
  styleUrl: './toast-container.css',
  imports: [TranslocoPipe],

  template: `
    <div
      class="toast-enter pointer-events-auto px-2.5"
      data-testid="toast">
      <div
        [class]="
          'relative flex items-center gap-4 rounded-lg border p-4 transition-all duration-300 ' +
          getAlertClasses()
        ">
        <p
          class="min-w-0 flex-1 text-center font-medium wrap-break-word md:text-left"
          [attr.role]="data().type === 'error' ? 'alert' : 'status'"
          aria-atomic="true"
          [attr.aria-live]="data().type === 'error' ? 'assertive' : 'polite'">
          {{ data().message }}
        </p>
        <button
          type="button"
          class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          [attr.aria-label]="'common.a11y.closeNotification' | transloco"
          (click)="dismiss($event)"
          (keydown.escape)="dismiss($event)">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-4 w-4"
            aria-hidden="true">
            <line
              x1="18"
              y1="6"
              x2="6"
              y2="18" />
            <line
              x1="6"
              y1="6"
              x2="18"
              y2="18" />
          </svg>
        </button>
      </div>
    </div>
  `,
})
export class ToastContainer {
  readonly data = input<ToastData>({ message: '', type: 'info' });
  readonly dismissed = output();

  protected getAlertClasses(): string {
    const type = this.data().type;
    switch (type) {
      case 'success':
        return 'bg-base-100 border-green-500/30 text-green-700 dark:text-green-300 dark:shadow-sm shadow-green-500/20 dark:shadow-green-500/10';
      case 'error':
        return 'bg-base-100 border-red-500/30 text-red-700 dark:text-red-300 dark:shadow-sm shadow-red-500/20 dark:shadow-red-500/10';
      case 'info':
      default:
        return 'bg-base-100 border-blue-500/30 text-blue-700 dark:text-blue-300 dark:shadow-sm shadow-blue-500/20 dark:shadow-blue-500/10';
    }
  }

  protected dismiss(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.dismissed.emit();
  }
}
