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
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AppIconComponent, ButtonComponent],
  templateUrl: './verify.component.html',
  styleUrl: './verify.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  readonly languageService = inject(LanguageService);
  readonly themeService = inject(ThemeService);

  readonly status = signal<'loading' | 'success' | 'error'>('loading');
  readonly errorMessage = signal<string>('');
  readonly resendLoading = signal<boolean>(false);
  readonly resendSuccess = signal<boolean>(false);

  private hasTriggeredVerification = false;

  readonly resendForm = new FormGroup({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const token = params.get('token');
      if (!token) {
        this.status.set('error');
        this.errorMessage.set(this.languageService.t().auth.verify.missingToken);
        return;
      }

      if (this.hasTriggeredVerification) {
        return;
      }
      this.hasTriggeredVerification = true;

      this.verifyToken(token);
    });
  }

  private verifyToken(token: string): void {
    this.status.set('loading');
    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.status.set('success');
      },
      error: (err) => {
        this.status.set('error');
        const detail =
          err?.error?.detail ||
          err?.error?.message ||
          'Liên kết xác thực không hợp lệ hoặc đã hết hạn.';
        this.errorMessage.set(detail);
      },
    });
  }

  handleResend(): void {
    if (this.resendForm.invalid) {
      this.resendForm.markAllAsTouched();
      return;
    }

    const email = this.resendForm.controls.email.value.trim();
    if (!email) return;

    this.resendLoading.set(true);
    this.resendSuccess.set(false);
    this.errorMessage.set('');

    this.authService.resendVerification(email).subscribe({
      next: () => {
        this.resendLoading.set(false);
        this.resendSuccess.set(true);
      },
      error: (err) => {
        this.resendLoading.set(false);
        const detail =
          err?.error?.detail ||
          err?.error?.message ||
          'Không thể gửi lại email xác thực. Vui lòng thử lại.';
        this.errorMessage.set(detail);
      },
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
