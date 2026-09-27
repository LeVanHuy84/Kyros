import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppIconComponent, AppIconName } from '../icon/icon.component';
import { ButtonComponent } from '../button/button.component';

export type ConfirmVariant = 'danger' | 'warning' | 'primary';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, AppIconComponent, ButtonComponent],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmModalComponent {
  isOpen = input.required<boolean>();
  title = input<string>('Xác nhận');
  message = input<string>('Bạn có chắc chắn muốn thực hiện hành động này không?');
  confirmText = input<string>('Xác nhận');
  cancelText = input<string>('Hủy');
  variant = input<ConfirmVariant>('danger');
  loading = input<boolean>(false);
  iconName = input<AppIconName>('alert-triangle');

  confirm = output<void>();
  cancel = output<void>();

  protected onBackdropClick(): void {
    if (!this.loading()) {
      this.cancel.emit();
    }
  }

  protected onConfirm(): void {
    if (!this.loading()) {
      this.confirm.emit();
    }
  }

  protected onCancel(): void {
    if (!this.loading()) {
      this.cancel.emit();
    }
  }
}
