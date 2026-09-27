export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  avatarUrl?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface JwtClaims {
  sub: string;
  email: string;
  roles?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface VerifyTokenRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}
