// src/utils/user-data-store.ts
import { CustomerData } from "@/types/payment.types";

interface StoredUserData extends Partial<CustomerData> {
  lastPaymentReference?: string;
}

// Almacenamiento en memoria (no usa localStorage)
class UserDataStore {
  private static instance: UserDataStore;
  private userData: Map<string, StoredUserData> = new Map();

  private constructor() {}

  static getInstance(): UserDataStore {
    if (!UserDataStore.instance) {
      UserDataStore.instance = new UserDataStore();
    }
    return UserDataStore.instance;
  }

  // Guardar datos del usuario
  saveUserData(userId: string, data: StoredUserData): void {
    const existing = this.userData.get(userId) || {};
    this.userData.set(userId, { ...existing, ...data });
  }

  // Obtener datos del usuario
  getUserData(userId: string): StoredUserData | null {
    return this.userData.get(userId) || null;
  }

  // Obtener última referencia de pago
  getLastPaymentReference(userId: string): string | null {
    const data = this.userData.get(userId);
    return data?.lastPaymentReference || null;
  }

  // Limpiar datos del usuario
  clearUserData(userId: string): void {
    this.userData.delete(userId);
  }

  // Limpiar todos los datos
  clearAll(): void {
    this.userData.clear();
  }
}

export const userDataStore = UserDataStore.getInstance();
