import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { LanguageService } from '@core/services/language.service';
import { ThemeService } from '@core/services/theme.service';
import { KyrosLogoComponent } from '@shared/components/logo/kyros-logo.component';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ToastService } from '@shared/components/toast/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    KyrosLogoComponent,
    AppIconComponent,
    ButtonComponent,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  readonly languageService = inject(LanguageService);
  readonly themeService = inject(ThemeService);

  readonly isLoading = signal<boolean>(false);
  readonly isSuccess = signal<boolean>(false);
  readonly submittedEmail = signal<string>('');
  readonly errorMessage = signal<string | null>(null);

  readonly forgotForm = new FormGroup({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  handleSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    const email = this.forgotForm.controls.email.value.trim();
    if (!email) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.submittedEmail.set(email);
        this.isSuccess.set(true);
        this.toastService.success(
          this.languageService.t().auth.forgot.resendSuccess,
          this.languageService.t().common.success
        );
      },
      error: (err) => {
        this.isLoading.set(false);
        const detail =
          err?.error?.detail ||
          err?.error?.message ||
          'Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng kiểm tra lại email.';
        this.errorMessage.set(detail);
      },
    });
  }

  handleResend(): void {
    const email = this.submittedEmail() || this.forgotForm.controls.email.value.trim();
    if (!email) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toastService.success(
          this.languageService.t().auth.forgot.resendSuccess,
          this.languageService.t().common.success
        );
      },
      error: (err) => {
        this.isLoading.set(false);
        const detail =
          err?.error?.detail ||
          err?.error?.message ||
          'Không thể gửi lại yêu cầu. Vui lòng thử lại sau.';
        this.errorMessage.set(detail);
      },
    });
  }
}
