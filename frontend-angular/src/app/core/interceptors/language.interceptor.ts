import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LanguageService } from '../services/language.service';

/**
 * Automatically injects the Accept-Language header into every outgoing HTTP request
 * based on the active language Signal in LanguageService.
 */
export const languageInterceptor: HttpInterceptorFn = (req, next) => {
  const languageService = inject(LanguageService);
  const currentLang = languageService.currentLanguage();

  if (req.headers.has('Accept-Language')) {
    return next(req);
  }

  const modifiedReq = req.clone({
    setHeaders: {
      'Accept-Language': currentLang,
    },
  });

  return next(modifiedReq);
};
