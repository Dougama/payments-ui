// src/utils/error-handler.ts
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export class AppError extends Error {
  code?: string;
  status?: number;
  details?: any;

  constructor(message: string, code?: string, status?: number, details?: any) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function handleApiError(error: any): AppError {
  // Handle network errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return new AppError(
      "Error de conexión. Por favor verifica tu conexión a internet.",
      "NETWORK_ERROR",
      0
    );
  }

  // Handle API errors
  if (error.status) {
    switch (error.status) {
      case 400:
        return new AppError(
          error.message || "Datos inválidos",
          "VALIDATION_ERROR",
          400,
          error.data
        );
      case 401:
        return new AppError(
          "No autorizado. Por favor inicia sesión.",
          "UNAUTHORIZED",
          401
        );
      case 404:
        return new AppError(
          error.message || "Recurso no encontrado",
          "NOT_FOUND",
          404
        );
      case 409:
        return new AppError(
          error.message || "Ya existe un pago en proceso",
          "PAYMENT_IN_PROGRESS",
          409,
          error.data
        );
      case 429:
        return new AppError(
          "Demasiadas solicitudes. Por favor intenta más tarde.",
          "RATE_LIMIT",
          429
        );
      case 500:
      case 502:
      case 503:
        return new AppError(
          "Error del servidor. Por favor intenta más tarde.",
          "SERVER_ERROR",
          error.status
        );
      default:
        return new AppError(
          error.message || "Error desconocido",
          "UNKNOWN_ERROR",
          error.status,
          error.data
        );
    }
  }

  // Handle Firebase Auth errors
  if (error.code?.startsWith("auth/")) {
    const authErrors: Record<string, string> = {
      "auth/user-not-found": "Usuario no encontrado",
      "auth/wrong-password": "Contraseña incorrecta",
      "auth/email-already-in-use": "El email ya está en uso",
      "auth/weak-password": "La contraseña es muy débil",
      "auth/invalid-email": "Email inválido",
      "auth/too-many-requests": "Demasiados intentos. Intenta más tarde",
    };

    return new AppError(
      authErrors[error.code] || error.message,
      error.code,
      400
    );
  }

  // Handle generic errors
  if (error instanceof Error) {
    return new AppError(error.message, "UNKNOWN_ERROR");
  }

  return new AppError("Error desconocido", "UNKNOWN_ERROR");
}

export function getErrorMessage(error: any): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Ha ocurrido un error inesperado";
}

// Global error logging
export function logError(error: any, context?: string): void {
  console.error(`[${context || "ERROR"}]`, {
    message: error.message || error,
    code: error.code,
    status: error.status,
    stack: error.stack,
    details: error.details,
    timestamp: new Date().toISOString(),
  });
}
