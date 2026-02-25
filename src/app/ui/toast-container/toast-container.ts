import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export type ToastData = {
  message: string;
  type: ToastType;
};

@Component({
  selector: 'app-toast-container',
  styleUrl: './toast-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="toast-enter pointer-events-auto px-2.5"
      role="alert"
      aria-atomic="true"
      [attr.aria-live]="data().type === 'error' ? 'assertive' : 'polite'">
      <div
        [class]="
          'relative flex items-center gap-4 rounded-lg border p-4 backdrop-blur-md transition-all duration-300 ' +
          getAlertClasses()
        ">
        <p class="flex-1 text-center font-medium md:text-left">{{ data().message }}</p>
        <button
          type="button"
          class="shrink-0 cursor-pointer opacity-60 transition-opacity hover:opacity-100"
          aria-label="Close notification"
          (click)="dismiss()">
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
        return 'bg-green-500/5 border-green-500/30 text-green-700 dark:text-green-300 dark:shadow-sm shadow-green-500/20 dark:shadow-green-500/10';
      case 'error':
        return 'bg-red-500/5 border-red-500/30 text-red-700 dark:text-red-300 dark:shadow-sm shadow-red-500/20 dark:shadow-red-500/10';
      case 'info':
      default:
        return 'bg-blue-500/5 border-blue-500/30 text-blue-700 dark:text-blue-300 dark:shadow-sm shadow-blue-500/20 dark:shadow-blue-500/10';
    }
  }

  protected dismiss(): void {
    this.dismissed.emit();
  }
}
