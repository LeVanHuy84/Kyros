import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { LanguageService } from '@core/services/language.service';
import { ThemeService } from '@core/services/theme.service';
import { KyrosLogoComponent } from '@shared/components/logo/kyros-logo.component';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ToastService } from '@shared/components/toast/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    KyrosLogoComponent,
    AppIconComponent,
    ButtonComponent,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  readonly languageService = inject(LanguageService);
  readonly themeService = inject(ThemeService);

  readonly token = signal<string | null>(null);
  readonly showPassword = signal<boolean>(false);
  readonly showConfirmPassword = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly isSuccess = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isInvalidToken = signal<boolean>(false);

  readonly resetForm = new FormGroup({
    newPassword: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    confirmPassword: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const resetToken = params.get('token');
      if (!resetToken) {
        this.isInvalidToken.set(true);
        this.errorMessage.set(this.languageService.t().auth.reset.invalidTokenSubtitle);
      } else {
        this.token.set(resetToken);
        this.isInvalidToken.set(false);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  handleSubmit(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const { newPassword, confirmPassword } = this.resetForm.getRawValue();

    if (newPassword.length < 8) {
      this.errorMessage.set(this.languageService.t().auth.passwordMinLength);
      return;
    }

    if (newPassword !== confirmPassword) {
      this.errorMessage.set(this.languageService.t().auth.passwordsDoNotMatch);
      return;
    }

    const tokenVal = this.token();
    if (!tokenVal) {
      this.isInvalidToken.set(true);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.resetPassword(tokenVal, newPassword).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isSuccess.set(true);
        this.toastService.success(
          this.languageService.t().auth.reset.successTitle,
          this.languageService.t().common.success
        );
      },
      error: (err) => {
        this.isLoading.set(false);
        const detail =
          err?.error?.detail ||
          err?.error?.message ||
          'Không thể đặt lại mật khẩu. Liên kết có thể đã hết hạn.';
        this.errorMessage.set(detail);

        const lower = detail.toLowerCase();
        if (lower.includes('expired') || lower.includes('invalid') || lower.includes('hết hạn')) {
          this.isInvalidToken.set(true);
        }
      },
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
