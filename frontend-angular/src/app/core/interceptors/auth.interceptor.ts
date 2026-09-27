import { HttpInterceptorFn } from '@angular/common/http';

const PUBLIC_AUTH_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify',
  '/api/auth/resend-verification',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/refresh',
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('kyros_access_token');

  const isPublicAuth = PUBLIC_AUTH_ENDPOINTS.some((endpoint) => req.url.includes(endpoint));

  // Do not add Authorization for public auth endpoints or if token is missing or already has Authorization header
  if (!token || req.headers.has('Authorization') || isPublicAuth) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authReq);
};
