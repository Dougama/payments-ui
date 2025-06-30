// src/pages/PaymentResultPage.tsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePayment } from "@/contexts/PaymentContext";
import { paymentService } from "@/services/payment.service";
import { Alert } from "@/components/common/Alert";
import { getErrorMessage } from "@/utils/error-handler";
import { WompiWebhookEvent } from "@/types/payment.types";

export function PaymentResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { paymentData } = usePayment();
  const transaction = location.state?.transaction || {};

  const [loading, setLoading] = useState(false);
  const [webhookResponse, setWebhookResponse] = useState<any>(null);
  const [checkResponse, setCheckResponse] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const simulateWebhook = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Create webhook event data
      const webhookEvent: WompiWebhookEvent = {
        event: "transaction.updated",
        data: {
          transaction: {
            id: paymentData.transactionId || transaction.id,
            status: "APPROVED", // Simulating approved status
            reference: paymentData.reference || transaction.reference,
            amount_in_cents:
              transaction.amount_in_cents ||
              paymentData.widgetConfig?.amountInCents ||
              0,
            currency: "COP",
            payment_method_type: "CARD",
            customer_email: paymentData.checkoutData?.customerData.email || "",
            created_at: new Date().toISOString(),
            finalized_at: new Date().toISOString(),
            payment_method: {
              type: "CARD",
              extra: {
                brand: "VISA",
                last_four: "4242",
              },
            },
            shipping_address: paymentData.checkoutData?.shippingAddress,
          },
        },
        environment: "test",
        signature: {
          properties: [
            "transaction.id",
            "transaction.status",
            "transaction.amount_in_cents",
          ],
          checksum: "test_checksum",
        },
        timestamp: Date.now(),
        sent_at: new Date().toISOString(),
      };

      const response = await paymentService.simulateWebhook(webhookEvent);
      setWebhookResponse(response);
      setSuccess("Webhook simulado exitosamente");
    } catch (err) {
      setError(`Error webhook: ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const checkTransaction = async () => {
    if (!user) {
      setError("Usuario no autenticado");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await paymentService.checkTransaction(user.uid, {
        transactionId: paymentData.transactionId || transaction.id,
        reference: paymentData.reference || transaction.reference,
      });

      setCheckResponse(response);

      if (response.success) {
        setSuccess(`Transacción verificada: ${response.data?.status}`);
      } else {
        setError(response.error || "Error al verificar transacción");
      }
    } catch (err) {
      setError(`Error verificación: ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-center mb-4">Resultado del Pago</h1>

      <div className="card mb-3">
        <div className="card-header">
          <h3 className="card-title">Información de la transacción</h3>
        </div>
        <div>
          <p>
            <strong>ID de transacción:</strong>{" "}
            {paymentData.transactionId || transaction.id || "N/A"}
          </p>
          <p>
            <strong>Referencia:</strong>{" "}
            {paymentData.reference || transaction.reference || "N/A"}
          </p>
          <p>
            <strong>Estado inicial:</strong> {transaction.status || "PENDING"}
          </p>
          {transaction.amount_in_cents && (
            <p>
              <strong>Monto:</strong> $
              {(transaction.amount_in_cents / 100).toLocaleString("es-CO")} COP
            </p>
          )}
        </div>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError("")} />
      )}
      {success && (
        <Alert
          type="success"
          message={success}
          onClose={() => setSuccess("")}
        />
      )}

      <div
        style={{
          display: "flex",
          gap: "1rem",
          flexDirection: "column",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        <button
          onClick={simulateWebhook}
          className="btn btn-primary btn-block"
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : "Simular Webhook de Wompi"}
        </button>

        <button
          onClick={checkTransaction}
          className="btn btn-success btn-block"
          disabled={loading}
        >
          {loading ? (
            <span className="spinner" />
          ) : (
            "Verificar Estado de Transacción"
          )}
        </button>

        <button
          onClick={() => navigate("/")}
          className="btn btn-outline btn-block"
        >
          Volver al inicio
        </button>
      </div>

      {webhookResponse && (
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">Respuesta del Webhook</h3>
          </div>
          <pre
            style={{
              background: "#f5f5f5",
              padding: "1rem",
              borderRadius: "4px",
              overflow: "auto",
              fontSize: "0.875rem",
            }}
          >
            {JSON.stringify(webhookResponse, null, 2)}
          </pre>
        </div>
      )}

      {checkResponse && (
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="card-title">Estado de la Transacción</h3>
          </div>
          <pre
            style={{
              background: "#f5f5f5",
              padding: "1rem",
              borderRadius: "4px",
              overflow: "auto",
              fontSize: "0.875rem",
            }}
          >
            {JSON.stringify(checkResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
