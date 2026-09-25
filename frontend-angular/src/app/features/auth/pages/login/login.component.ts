import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { LanguageService } from '@core/services/language.service';
import { ThemeService } from '@core/services/theme.service';
import { KyrosLogoComponent } from '@shared/components/logo/kyros-logo.component';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ToastService } from '@shared/components/toast/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    KyrosLogoComponent,
    AppIconComponent,
    ButtonComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toastService = inject(ToastService);
  readonly languageService = inject(LanguageService);
  readonly themeService = inject(ThemeService);

  readonly isRegister = signal<boolean>(false);
  readonly showPassword = signal<boolean>(false);
  readonly showConfirmPassword = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Resend verification states
  readonly showResend = signal<boolean>(false);
  readonly resendLoading = signal<boolean>(false);
  readonly resendSuccess = signal<boolean>(false);

  readonly authForm = new FormGroup({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
    confirmPassword: new FormControl<string>('', {
      nonNullable: true,
    }),
  });

  ngOnInit(): void {
    // Check if routed to register mode
    this.route.url.subscribe((segments) => {
      const isReg = segments.some((s) => s.path === 'register');
      this.isRegister.set(isReg);
      this.updatePasswordValidators(isReg);
    });

    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/agent']);
    }
  }

  toggleMode(): void {
    const newMode = !this.isRegister();
    this.isRegister.set(newMode);
    this.updatePasswordValidators(newMode);
    this.authForm.patchValue({ password: '', confirmPassword: '' });
    this.errorMessage.set(null);
    this.showResend.set(false);
    this.resendSuccess.set(false);
    this.showPassword.set(false);
    this.showConfirmPassword.set(false);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  private updatePasswordValidators(isReg: boolean): void {
    const passwordControl = this.authForm.controls.password;
    const confirmControl = this.authForm.controls.confirmPassword;

    if (isReg) {
      passwordControl.setValidators([Validators.required, Validators.minLength(8)]);
      confirmControl.setValidators([Validators.required]);
    } else {
      passwordControl.setValidators([Validators.required]);
      confirmControl.clearValidators();
    }
    passwordControl.updateValueAndValidity();
    confirmControl.updateValueAndValidity();
  }

  handleResendVerification(): void {
    const email = this.authForm.controls.email.value.trim();
    if (!email) {
      this.errorMessage.set(this.languageService.t().auth.emailRequired);
      return;
    }

    this.resendLoading.set(true);
    this.resendSuccess.set(false);
    this.errorMessage.set(null);

    this.authService.resendVerification(email).subscribe({
      next: () => {
        this.resendLoading.set(false);
        this.resendSuccess.set(true);
        this.showResend.set(false);
        this.toastService.success(
          this.languageService.t().auth.verify.resendSuccess,
          this.languageService.t().common.success
        );
      },
      error: (err) => {
        this.resendLoading.set(false);
        const msg = err?.error?.detail || err?.friendlyMessage || 'Không thể gửi lại email xác thực.';
        this.errorMessage.set(msg);
      },
    });
  }

  handleSubmit(): void {
    if (this.authForm.invalid) {
      this.authForm.markAllAsTouched();
      return;
    }

    const { email, password, confirmPassword } = this.authForm.getRawValue();

    if (this.isRegister()) {
      if (password.length < 8) {
        this.errorMessage.set(this.languageService.t().auth.passwordMinLength);
        return;
      }
      if (password !== confirmPassword) {
        this.errorMessage.set(this.languageService.t().auth.passwordsDoNotMatch);
        return;
      }
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.resendSuccess.set(false);
    this.showResend.set(false);

    if (this.isRegister()) {
      this.authService.register({ email, password }).subscribe({
        next: () => {
          // Attempt login
          this.authService.login({ email, password }).subscribe({
            next: () => {
              this.isLoading.set(false);
              this.router.navigate(['/agent']);
            },
            error: (loginErr) => {
              this.isLoading.set(false);
              this.handleAuthError(loginErr, true);
            },
          });
        },
        error: (err) => {
          this.isLoading.set(false);
          this.handleAuthError(err, true);
        },
      });
    } else {
      this.authService.login({ email, password }).subscribe({
        next: () => {
          this.isLoading.set(false);
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/agent';
          this.router.navigateByUrl(returnUrl);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.handleAuthError(err, false);
        },
      });
    }
  }

  private handleAuthError(err: any, isReg: boolean): void {
    const problemDetail = err?.error?.detail || err?.error?.message;
    const defaultMsg = isReg
      ? 'Đăng ký không thành công. Email này có thể đã được sử dụng.'
      : 'Đăng nhập không thành công. Vui lòng kiểm tra email và mật khẩu.';

    const msg = problemDetail || defaultMsg;
    this.errorMessage.set(msg);

    const lower = msg.toLowerCase();
    if (lower.includes('verify') || lower.includes('xác thực') || lower.includes('not verified')) {
      this.showResend.set(true);
    }
  }
}
