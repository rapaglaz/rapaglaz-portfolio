import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export type ToastData = {
  message: string;
  type: ToastType;
};

@Component({
  selector: 'app-toast-container',
  imports: [],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainer {
  readonly data = signal<ToastData>({ message: '', type: 'info' });
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
