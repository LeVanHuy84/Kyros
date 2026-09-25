import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '@shared/components/toast/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại.';

      if (error.error instanceof ErrorEvent) {
        // Client-side network error
        errorMessage = error.error.message;
      } else {
        // Server-side response error
        if (error.status === 401) {
          // If unauthorized and not an auth attempt, redirect to login
          if (!req.url.includes('/api/auth/login')) {
            localStorage.removeItem('kyros_access_token');
            router.navigate(['/auth/login']);
            errorMessage = 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.';
          } else {
            errorMessage = error.error?.message || 'Email hoặc mật khẩu không chính xác.';
          }
        } else if (error.status === 403) {
          errorMessage = 'Bạn không có quyền thực hiện hành động này trong không gian làm việc.';
        } else if (error.status === 404) {
          errorMessage = error.error?.message || 'Không tìm thấy tài nguyên yêu cầu.';
        } else if (error.status >= 500) {
          errorMessage = error.error?.message || 'Lỗi hệ thống máy chủ (500). Vui lòng thử lại sau.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
      }

      toastService.error(errorMessage);
      return throwError(() => error);
    })
  );
};
