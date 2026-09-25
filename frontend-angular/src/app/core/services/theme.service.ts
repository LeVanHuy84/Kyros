import { Injectable, effect, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'kyros_theme_preference';
  
  readonly theme = signal<ThemeMode>(this.getInitialTheme());
  readonly isDark = signal<boolean>(false);

  constructor() {
    this.updateThemeEffect();
  }

  private getInitialTheme(): ThemeMode {
    const saved = localStorage.getItem(this.STORAGE_KEY) as ThemeMode | null;
    return saved || 'system';
  }

  setTheme(mode: ThemeMode): void {
    this.theme.set(mode);
    localStorage.setItem(this.STORAGE_KEY, mode);
    this.applyTheme(mode);
  }

  toggleTheme(): void {
    const next = this.isDark() ? 'light' : 'dark';
    this.setTheme(next);
  }

  private updateThemeEffect(): void {
    effect(() => {
      const mode = this.theme();
      this.applyTheme(mode);
    });
  }

  private applyTheme(mode: ThemeMode): void {
    let dark = false;
    if (mode === 'system') {
      dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      dark = mode === 'dark';
    }

    this.isDark.set(dark);
    const root = document.documentElement;
    if (dark) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  }
}
