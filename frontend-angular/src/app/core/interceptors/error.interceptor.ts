import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '@shared/components/toast/toast.service';
import { ProblemDetail } from '../models/problem-detail.model';

/**
 * Global HTTP Error Interceptor supporting RFC 7807 ProblemDetail format from Backend.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorTitle = 'Lỗi hệ thống';
      let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';

      if (error.error instanceof ErrorEvent) {
        // Client-side network or connection error
        errorTitle = 'Lỗi kết nối';
        errorMessage = error.error.message;
      } else if (error.error && typeof error.error === 'object') {
        const problem = error.error as ProblemDetail;

        // Extract title from backend RFC 7807 ProblemDetail
        if (problem.title) {
          errorTitle = problem.title;
        }

        // Extract message / detail from backend ProblemDetail
        if (problem.errors && problem.errors.length > 0) {
          // Validation error list
          errorMessage = problem.errors.map((e) => e.message || `${e.field} không hợp lệ`).join('\n');
        } else if (problem.detail) {
          errorMessage = problem.detail;
        } else if ((error.error as any).message) {
          errorMessage = (error.error as any).message;
        }
      }

      // Handle specific HTTP Status Codes
      if (error.status === 401) {
        if (!req.url.includes('/api/auth/login')) {
          localStorage.removeItem('kyros_access_token');
          router.navigate(['/auth/login']);
          if (!errorMessage || errorMessage === 'Đã có lỗi xảy ra. Vui lòng thử lại sau.') {
            errorMessage = 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.';
          }
        }
      } else if (error.status === 403) {
        if (!errorTitle || errorTitle === 'Lỗi hệ thống') {
          errorTitle = 'Không có quyền truy cập';
        }
      } else if (error.status === 404) {
        if (!errorTitle || errorTitle === 'Lỗi hệ thống') {
          errorTitle = 'Không tìm thấy dữ liệu';
        }
      }

      // Display standardized toast error
      toastService.error(errorMessage, errorTitle);

      return throwError(() => error);
    })
  );
};
