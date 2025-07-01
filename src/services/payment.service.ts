// src/services/payment.service.ts
import { apiClient } from "./api.client";
import {
  ProductResponse,
  CheckoutRequest,
  CheckoutResponse,
  TransactionCheckRequest,
  TransactionCheckResponse,
  WompiWebhookEvent,
} from "@/types/payment.types";

export class PaymentService {
  async getProduct(
    sku: string,
    userId: string,
    couponCode?: string
  ): Promise<ProductResponse> {
    const params = couponCode ? `?coupon_code=${couponCode}` : "";
    return apiClient.get<ProductResponse>(
      `/products/${sku}/users/${userId}${params}`
    );
  }

  async checkout(
    userId: string,
    data: CheckoutRequest
  ): Promise<CheckoutResponse> {
    return apiClient.post<CheckoutResponse>(
      `/payments/users/${userId}/checkout`,
      data
    );
  }

  async cancelTransaction(
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/payments/users/${userId}/cancel`);
  }

  async checkTransaction(
    userId: string,
    data: TransactionCheckRequest
  ): Promise<TransactionCheckResponse> {
    return apiClient.post<TransactionCheckResponse>(
      `/payments/users/${userId}/check-transaction`,
      data
    );
  }

  async getPaymentReference(userId: string): Promise<{
    success: boolean;
    data?: {
      reference: string;
      userId: string;
    };
    error?: string;
  }> {
    return apiClient.get(`/payments/users/${userId}/reference`);
  }

  async simulateWebhook(webhookData: WompiWebhookEvent): Promise<any> {
    // For testing, we'll send this to the webhook endpoint
    // In real environment, this would come from Wompi directly
    return apiClient.post("/payments/webhook", webhookData, {
      skipAuth: true,
      headers: {
        "x-wompi-signature":
          "sig_alg=sha256 sig=test_signature timestamp=" + Date.now(),
      },
    });
  }
}

export const paymentService = new PaymentService();
