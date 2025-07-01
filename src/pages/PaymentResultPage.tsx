// src/pages/PaymentResultPage.tsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePayment } from "@/contexts/PaymentContext";
import { paymentService } from "@/services/payment.service";
import { userDataStore } from "@/utils/user-data-store";
import { Alert } from "@/components/common/Alert";
import { Loading } from "@/components/common/Loading";
import { getErrorMessage } from "@/utils/error-handler";
import { WompiWebhookEvent } from "@/types/payment.types";

export function PaymentResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { paymentData } = usePayment();
  const transaction = location.state?.transaction || {};

  const [loading, setLoading] = useState(false);
  const [checkingTransaction, setCheckingTransaction] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<any>(null);
  const [webhookResponse, setWebhookResponse] = useState<any>(null);
  const [checkResponse, setCheckResponse] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Obtener el ID de la transacción de la URL
  const transactionIdFromUrl = searchParams.get("id");
  const [reference, setReference] = useState<string | null>(null);

  // Primero obtener la referencia del backend
  useEffect(() => {
    if (transactionIdFromUrl && user) {
      getPaymentReference();
    }
  }, [transactionIdFromUrl, user]);

  const getPaymentReference = async () => {
    try {
      console.log("Getting payment reference for user:", user!.uid);
      const response = await paymentService.getPaymentReference(user!.uid);

      if (response.success && response.data) {
        console.log("Got reference:", response.data.reference);
        setReference(response.data.reference);

        // Ahora que tenemos la referencia, verificar la transacción
        if (transactionIdFromUrl) {
          checkTransactionAutomatically(
            transactionIdFromUrl,
            response.data.reference
          );
        }
      } else {
        setError("No se pudo obtener la referencia del pago");
      }
    } catch (err) {
      console.error("Error getting payment reference:", err);
      setError(getErrorMessage(err));
    }
  };

  const checkTransactionAutomatically = async (
    transactionId: string,
    reference: string
  ) => {
    if (!user) {
      return;
    }

    setCheckingTransaction(true);
    setError("");

    try {
      console.log("Checking transaction:", {
        transactionId: transactionId,
        reference: reference,
      });

      const response = await paymentService.checkTransaction(user.uid, {
        transactionId: transactionId,
        reference: reference,
      });
      console.log("responseCheck", response);

      setCheckResponse(response);

      if (response.success && response.data) {
        setTransactionStatus(response.data);

        // Mostrar mensaje según el estado
        switch (response.data.status) {
          case "APPROVED":
            setSuccess("¡Pago aprobado exitosamente! 🎉");
            break;
          case "PENDING":
            setSuccess("Pago pendiente de confirmación ⏳");
            break;
          case "DECLINED":
            setError("El pago fue rechazado ❌");
            break;
          case "ERROR":
            setError("Error al procesar el pago ⚠️");
            break;
          default:
            setSuccess(`Estado de transacción: ${response.data.status}`);
        }
      } else {
        setError(response.error || "Error al verificar la transacción");
      }
    } catch (err) {
      console.error("Error checking transaction:", err);
      setError(getErrorMessage(err));
    } finally {
      setCheckingTransaction(false);
    }
  };

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
            id:
              transactionIdFromUrl ||
              paymentData.transactionId ||
              transaction.id,
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
    } catch (err: any) {
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
        transactionId:
          transactionIdFromUrl || paymentData.transactionId || transaction.id,
        reference: paymentData.reference || transaction.reference,
      });

      setCheckResponse(response);

      if (response.success) {
        setTransactionStatus(response.data);
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

  // Si no hay ID en la URL, redirigir al inicio
  if (!transactionIdFromUrl) {
    navigate("/");
    return null;
  }

  // Mostrar loading mientras se obtiene la información inicial
  if (!reference && !error) {
    return <Loading fullScreen message="Obteniendo información del pago..." />;
  }

  return (
    <div>
      <h1 className="text-center mb-4">Resultado del Pago</h1>

      {/* Mostrar estado de la transacción si ya se verificó */}
      {transactionStatus && (
        <div
          className={`card mb-3 ${
            transactionStatus.status === "APPROVED" ? "border-success" : ""
          }`}
        >
          <div className="card-header">
            <h3 className="card-title">Estado de la Transacción</h3>
          </div>
          <div>
            <p>
              <strong>Estado:</strong>
              <span
                className={`
                ${transactionStatus.status === "APPROVED" ? "text-success" : ""}
                ${transactionStatus.status === "DECLINED" ? "text-error" : ""}
                ${transactionStatus.status === "PENDING" ? "text-warning" : ""}
              `}
              >
                {transactionStatus.status}
              </span>
            </p>
            <p>
              <strong>ID de transacción:</strong>{" "}
              {transactionStatus.id || transactionIdFromUrl}
            </p>
            <p>
              <strong>Referencia:</strong> {transactionStatus.reference}
            </p>
          </div>
        </div>
      )}

      <div className="card mb-3">
        <div className="card-header">
          <h3 className="card-title">Información de la transacción</h3>
        </div>
        <div>
          <p>
            <strong>ID de transacción:</strong>{" "}
            {transactionIdFromUrl ||
              paymentData.transactionId ||
              transaction.id ||
              "N/A"}
          </p>
          <p>
            <strong>Referencia:</strong> {reference || "N/A"}
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
        {/* Solo mostrar el botón de verificar si no se verificó automáticamente */}
        {!transactionStatus && transactionIdFromUrl && (
          <button
            onClick={() =>
              checkTransactionAutomatically(
                transactionIdFromUrl,
                reference || ""
              )
            }
            className="btn btn-primary btn-block"
            disabled={loading || !reference}
          >
            {loading ? (
              <span className="spinner" />
            ) : (
              "Verificar Estado de Transacción"
            )}
          </button>
        )}

        <button
          onClick={simulateWebhook}
          className="btn btn-secondary btn-block"
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : "Simular Webhook de Wompi"}
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
            <h3 className="card-title">Respuesta de Verificación</h3>
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
