import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@core/auth/services/auth.service';
import { LanguageService } from '@core/services/language.service';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ToastService } from '@shared/components/toast/toast.service';

@Component({
  selector: 'app-change-password-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent, ButtonComponent],
  templateUrl: './change-password-panel.component.html',
  styleUrl: './change-password-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordPanelComponent {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  readonly languageService = inject(LanguageService);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly showCurrentPassword = signal<boolean>(false);
  readonly showNewPassword = signal<boolean>(false);
  readonly showConfirmPassword = signal<boolean>(false);

  readonly passwordForm = new FormGroup({
    currentPassword: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    newPassword: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    confirmPassword: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword.update((v) => !v);
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword.update((v) => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  handleSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } =
      this.passwordForm.getRawValue();

    if (newPassword.length < 8) {
      this.errorMessage.set(this.languageService.t().auth.passwordMinLength);
      return;
    }

    if (newPassword !== confirmPassword) {
      this.errorMessage.set(this.languageService.t().auth.passwordsDoNotMatch);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService
      .changePassword({ currentPassword, newPassword })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.successMessage.set(
            this.languageService.t().settings.vault.passwordChangedSuccess
          );
          this.toastService.success(
            this.languageService.t().settings.vault.passwordChangedSuccess,
            this.languageService.t().common.success
          );
          this.passwordForm.reset();
        },
        error: (err) => {
          this.isLoading.set(false);
          const detail =
            err?.error?.detail ||
            err?.error?.message ||
            'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.';
          this.errorMessage.set(detail);
        },
      });
  }
}
