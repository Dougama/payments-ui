// src/types/payment.types.ts
export interface Product {
  sku: string;
  name: string;
  cost: number;
  cost_cents: number;
  currency_code: string;
  total: number;
  total_cents: number;
  enabled: boolean;
  price?: number;
  discount?: number;
  currencies?: {
    USD: number;
    EUR: number;
  };
}

export interface CustomerData {
  email: string;
  firstName?: string; // Solo para el formulario
  lastName?: string; // Solo para el formulario
  fullName: string; // Requerido para Wompi
  phoneNumber: string;
  phoneNumberPrefix?: string;
  legalId: string;
  legalIdType: "CC" | "CE" | "NIT" | "PP" | "TI" | "RC";
}

export interface ShippingAddress {
  addressLine1?: string;
  addressLine2?: string;
  city: string;
  region: string;
  country: string;
  phoneNumber?: string; // Agregado phoneNumber
  postalCode?: string;
}

export interface CheckoutRequest {
  sku: string;
  coupon_code?: string;
  customerData: CustomerData;
  shippingAddress: ShippingAddress;
}

export interface WidgetConfig {
  currency: string;
  reference: string;
  publicKey: string;
  amountInCents: number;
  redirectUrl: string;
  timestamp?: number;
  signature: {
    integrity: string;
  };
  customerData?: CustomerData;
  shippingAddress?: ShippingAddress;
}

export interface CheckoutResponse {
  success: boolean;
  payment: boolean;
  data?: WidgetConfig;
  error?: string;
}

export interface ProductResponse {
  success: boolean;
  payment: boolean;
  product?: Product;
  error?: string;
  message?: string;
}

export interface TransactionCheckRequest {
  transactionId: string;
  reference: string;
}

export interface TransactionCheckResponse {
  success: boolean;
  data?: {
    reference: string;
    status: "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR";
    id: string;
  };
  error?: string;
}

export interface WompiWebhookEvent {
  event: string;
  data: {
    transaction: {
      id: string;
      status: string;
      reference: string;
      amount_in_cents: number;
      currency: string;
      payment_method_type: string;
      customer_email: string;
      created_at: string;
      finalized_at: string;
      payment_method?: {
        type: string;
        extra?: any;
      };
      shipping_address?: any;
    };
  };
  environment: "test" | "production";
  signature: {
    properties: string[];
    checksum: string;
  };
  timestamp: number;
  sent_at: string;
}
