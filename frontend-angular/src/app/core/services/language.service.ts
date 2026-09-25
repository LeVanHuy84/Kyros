import { Injectable, computed, signal } from '@angular/core';
import { TranslationSchema, translations } from '../i18n/translations';

export type AppLanguage = 'vi' | 'en';

export interface LanguageOption {
  code: AppLanguage;
  label: string;
  flag: string;
}

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly STORAGE_KEY = 'kyros_user_language';

  readonly currentLanguage = signal<AppLanguage>(this.getInitialLanguage());

  /**
   * Reactive translation dictionary signal based on active language.
   */
  readonly t = computed<TranslationSchema>(() => translations[this.currentLanguage()]);

  readonly availableLanguages: LanguageOption[] = [
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  constructor() {
    document.documentElement.setAttribute('lang', this.currentLanguage());
  }

  private getInitialLanguage(): AppLanguage {
    const saved = localStorage.getItem(this.STORAGE_KEY) as AppLanguage | null;
    if (saved === 'vi' || saved === 'en') {
      return saved;
    }
    const browserLang = navigator.language?.toLowerCase() || '';
    if (browserLang.startsWith('vi')) {
      return 'vi';
    }
    return 'vi';
  }

  setLanguage(lang: AppLanguage): void {
    this.currentLanguage.set(lang);
    localStorage.setItem(this.STORAGE_KEY, lang);
    document.documentElement.setAttribute('lang', lang);
  }

  toggleLanguage(): void {
    const next = this.currentLanguage() === 'vi' ? 'en' : 'vi';
    this.setLanguage(next);
  }
}
