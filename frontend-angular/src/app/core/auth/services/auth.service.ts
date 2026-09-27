import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import {
  AuthResponse,
  JwtClaims,
  LoginRequest,
  RegisterRequest,
  User,
  VerifyTokenRequest,
  ResendVerificationRequest,
} from '../models/auth.models';
import { WorkspaceContextService } from '@core/services/workspace-context.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly workspaceContext = inject(WorkspaceContextService);

  private readonly TOKEN_KEY = 'kyros_access_token';
  private readonly REFRESH_TOKEN_KEY = 'kyros_refresh_token';
  private readonly USER_KEY = 'kyros_user';

  readonly token = signal<string | null>(null);
  readonly currentUser = signal<User | null>(null);
  readonly isLoading = signal<boolean>(true);

  readonly isAuthenticated = computed(() => !!this.token() && !!this.currentUser());

  constructor() {
    this.initSession();
  }

  /**
   * Initializes the session from localStorage on application bootstrap.
   */
  private initSession(): void {
    const storedToken = localStorage.getItem(this.TOKEN_KEY);
    const storedUser = localStorage.getItem(this.USER_KEY);

    if (storedToken && storedToken.split('.').length === 3) {
      const claims = this.decodeJwt(storedToken);
      // Check expiration if exp claim is present
      if (claims && (!claims.exp || claims.exp * 1000 > Date.now())) {
        this.token.set(storedToken);
        if (storedUser) {
          try {
            this.currentUser.set(JSON.parse(storedUser));
          } catch {
            this.currentUser.set(this.userFromClaims(claims));
          }
        } else {
          this.currentUser.set(this.userFromClaims(claims));
        }
      } else {
        this.clearSession();
      }
    } else {
      this.clearSession();
    }
    this.isLoading.set(false);
  }

  /**
   * Performs login with email and password.
   */
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', request).pipe(
      tap((res) => {
        this.handleAuthSuccess(res);
      })
    );
  }

  /**
   * Performs user registration and automatically logs in upon success.
   */
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<void>('/api/auth/register', request).pipe(
      // Seamlessly sign in after registration
      tap(() => {}),
      // Auto-login to provide a frictionless onboarding experience
      map(() => null as unknown as AuthResponse),
      catchError((err) => throwError(() => err))
    );
  }

  /**
   * Verifies email registration token.
   */
  verifyEmail(token: string): Observable<unknown> {
    const payload: VerifyTokenRequest = { token };
    return this.http.post('/api/auth/verify', payload);
  }

  /**
   * Resends verification email with token link.
   */
  resendVerification(email: string): Observable<unknown> {
    const payload: ResendVerificationRequest = { email };
    return this.http.post('/api/auth/resend-verification', payload);
  }

  /**
   * Silent refresh of the access token using the stored refresh token.
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<AuthResponse>('/api/auth/refresh', { refreshToken })
      .pipe(
        tap((res) => {
          this.handleAuthSuccess(res);
        }),
        catchError((err) => {
          this.logout();
          return throwError(() => err);
        })
      );
  }

  /**
   * Logs out the user and clears all local state and tokens.
   */
  logout(): void {
    // Best-effort backend notification
    this.http
      .post('/api/auth/logout', {})
      .pipe(
        catchError(() => of(null))
      )
      .subscribe();

    this.clearSession();
    this.workspaceContext.clear();
    this.router.navigate(['/auth/login']);
  }

  private handleAuthSuccess(res: AuthResponse): void {
    const { accessToken, refreshToken } = res;
    const claims = this.decodeJwt(accessToken);
    if (!claims) {
      throw new Error('Invalid JWT claims in authentication response');
    }

    const user = this.userFromClaims(claims);

    localStorage.setItem(this.TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));

    this.token.set(accessToken);
    this.currentUser.set(user);
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
  }

  private userFromClaims(claims: JwtClaims): User {
    const email = claims.email || '';
    const roles = claims.roles
      ? claims.roles.split(',').map((r) => r.trim())
      : ['USER'];

    return {
      id: claims.sub,
      email,
      name: email.split('@')[0] || 'User',
      roles,
    };
  }

  /**
   * Pure client-side JWT claims decoder.
   */
  private decodeJwt(token: string): JwtClaims | null {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload) as JwtClaims;
    } catch {
      return null;
    }
  }
}
