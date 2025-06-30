// src/config/environment.ts
interface EnvironmentConfig {
  API_BASE_URL: string;
  WOMPI_PUBLIC_KEY: string;
  TEST_PRODUCT_SKU: string;
  TEST_COUPON_CODE?: string;
  FIREBASE_CONFIG: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}

class Environment {
  private static instance: Environment;
  private config: EnvironmentConfig;

  private constructor() {
    this.config = {
      API_BASE_URL:
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3100",
      WOMPI_PUBLIC_KEY: import.meta.env.VITE_WOMPI_PUBLIC_KEY || "",
      TEST_PRODUCT_SKU:
        import.meta.env.VITE_TEST_PRODUCT_SKU || "TU-CARRERA-001",
      TEST_COUPON_CODE: import.meta.env.VITE_TEST_COUPON_CODE,
      FIREBASE_CONFIG: {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
        messagingSenderId:
          import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
        appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
      },
    };

    this.validateConfig();
  }

  static getInstance(): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment();
    }
    return Environment.instance;
  }

  private validateConfig(): void {
    const required = ["API_BASE_URL", "WOMPI_PUBLIC_KEY", "TEST_PRODUCT_SKU"];

    const missing = required.filter(
      (key) => !this.config[key as keyof EnvironmentConfig]
    );

    if (missing.length > 0) {
      console.error(
        `Missing required environment variables: ${missing.join(", ")}`
      );
    }
  }

  get(key: keyof EnvironmentConfig): any {
    return this.config[key];
  }

  getApiUrl(endpoint: string): string {
    const baseUrl = this.config.API_BASE_URL;
    return `${baseUrl}/api${endpoint}`;
  }

  isDevelopment(): boolean {
    return import.meta.env.DEV;
  }

  isProduction(): boolean {
    return import.meta.env.PROD;
  }
}

export const env = Environment.getInstance();
