// src/pages/PaymentResultPage.tsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePayment } from "@/contexts/PaymentContext";
import { paymentService } from "@/services/payment.service";
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
  const [, setCheckingTransaction] = useState(false);
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
          <div className="card-body">
            <p>
              <strong>Estado:</strong>
              <span
                className={`
                ${transactionStatus.status === "APPROVED" ? "text-success" : ""}
                ${transactionStatus.status === "DECLINED" ? "text-error" : ""}
                ${transactionStatus.status === "PENDING" ? "text-warning" : ""}
                ${transactionStatus.status === "ERROR" ? "text-error" : ""}
              `}
              >
                {" " + transactionStatus.status}
              </span>
            </p>
            <p>
              <strong>ID de Transacción:</strong> {transactionStatus.id}
            </p>
            <p>
              <strong>Referencia:</strong> {transactionStatus.reference}
            </p>
            <p>
              <strong>Monto:</strong> $
              {(transactionStatus.amount_in_cents / 100).toLocaleString(
                "es-CO"
              )}{" "}
              COP
            </p>
            {transactionStatus.payment_method && (
              <p>
                <strong>Método de pago:</strong>{" "}
                {transactionStatus.payment_method.type}
                {transactionStatus.payment_method.extra && (
                  <span>
                    {" "}
                    ({transactionStatus.payment_method.extra.brand || ""} ****
                    {transactionStatus.payment_method.extra.last_four || ""})
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Mostrar información del usuario si está disponible */}
      {checkResponse?.data?.user?.customerData && (
        <div className="card mb-3">
          <div className="card-header">
            <h3 className="card-title">Información del Cliente</h3>
          </div>
          <div className="card-body">
            {checkResponse.data.user.customerData.firstName &&
              checkResponse.data.user.customerData.lastName && (
                <p>
                  <strong>Nombre completo:</strong>{" "}
                  {checkResponse.data.user.customerData.firstName}{" "}
                  {checkResponse.data.user.customerData.lastName}
                </p>
              )}
            {checkResponse.data.user.customerData.email && (
              <p>
                <strong>Email:</strong>{" "}
                {checkResponse.data.user.customerData.email}
              </p>
            )}
            {checkResponse.data.user.customerData.phoneNumber && (
              <p>
                <strong>Teléfono:</strong>{" "}
                {checkResponse.data.user.customerData.phoneNumberPrefix || ""}{" "}
                {checkResponse.data.user.customerData.phoneNumber}
              </p>
            )}
            {checkResponse.data.user.customerData.legalId && (
              <p>
                <strong>Documento:</strong>{" "}
                {checkResponse.data.user.customerData.legalIdType || ""}{" "}
                {checkResponse.data.user.customerData.legalId}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Mostrar información de dirección de envío si está disponible */}
      {checkResponse?.data?.user?.shippingAddress && (
        <div className="card mb-3">
          <div className="card-header">
            <h3 className="card-title">Dirección de Envío</h3>
          </div>
          <div className="card-body">
            {checkResponse.data.user.shippingAddress.addressLine1 && (
              <p>
                <strong>Dirección:</strong>{" "}
                {checkResponse.data.user.shippingAddress.addressLine1}
              </p>
            )}
            {checkResponse.data.user.shippingAddress.city && (
              <p>
                <strong>Ciudad:</strong>{" "}
                {checkResponse.data.user.shippingAddress.city}
              </p>
            )}
            {checkResponse.data.user.shippingAddress.region && (
              <p>
                <strong>Región/Estado:</strong>{" "}
                {checkResponse.data.user.shippingAddress.region}
              </p>
            )}
            {checkResponse.data.user.shippingAddress.country && (
              <p>
                <strong>País:</strong>{" "}
                {checkResponse.data.user.shippingAddress.country}
              </p>
            )}
            {checkResponse.data.user.shippingAddress.phoneNumber && (
              <p>
                <strong>Teléfono de contacto:</strong>{" "}
                {checkResponse.data.user.shippingAddress.phoneNumber}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Mostrar alertas */}
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      {/* Botón para simular webhook (solo en desarrollo) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4">
          <button
            onClick={simulateWebhook}
            disabled={loading}
            className="btn btn-secondary"
          >
            {loading ? "Simulando..." : "Simular Webhook"}
          </button>
        </div>
      )}

      {/* Mostrar respuesta del webhook si existe */}
      {webhookResponse && (
        <div className="card mt-3">
          <div className="card-header">
            <h3 className="card-title">Respuesta del Webhook</h3>
          </div>
          <div className="card-body">
            <pre style={{ fontSize: "0.875rem", whiteSpace: "pre-wrap" }}>
              {JSON.stringify(webhookResponse, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Botones de navegación */}
      <div className="mt-4 text-center">
        <button onClick={() => navigate("/")} className="btn btn-primary">
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
