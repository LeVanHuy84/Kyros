import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('kyros_access_token');

  // Do not add Authorization for public auth endpoints or if token is missing
  if (!token || req.headers.has('Authorization') || req.url.includes('/api/auth/')) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authReq);
};
