// src/types/auth.types.ts
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends LoginCredentials {
  confirmPassword: string;
}

export interface AuthError {
  code: string;
  message: string;
}
