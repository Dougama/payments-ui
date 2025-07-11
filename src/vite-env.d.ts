/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_TEST_PRODUCT_SKU: string;
  readonly VITE_TEST_COUPON_CODE?: string;
  readonly VITE_DEFAULT_PWD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
