// src/pages/PaymentPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePayment } from "@/contexts/PaymentContext";
import { Alert } from "@/components/common/Alert";
import { env } from "@/config/environment";

declare global {
  interface Window {
    WidgetCheckout: any;
  }
}

export function PaymentPage() {
  const navigate = useNavigate();
  const { paymentData, updatePaymentData } = usePayment();
  const [error, setError] = useState("");
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!paymentData.widgetConfig) {
      navigate("/");
      return;
    }

    // Load Wompi script
    const script = document.createElement("script");
    script.src = "https://checkout.wompi.co/widget.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setError("Error al cargar el widget de pago");
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [paymentData, navigate]);

  useEffect(() => {
    if (scriptLoaded && paymentData.widgetConfig) {
      initializeWidget();
    }
  }, [scriptLoaded, paymentData.widgetConfig]);

  const initializeWidget = () => {
    try {
      const checkout = new window.WidgetCheckout({
        currency: paymentData.widgetConfig.currency,
        amountInCents: paymentData.widgetConfig.amountInCents,
        reference: paymentData.widgetConfig.reference,
        publicKey: paymentData.widgetConfig.publicKey,
        signature: {
          integrity: paymentData.widgetConfig.signature.integrity,
        },
        redirectUrl: `${window.location.origin}/payment-result`,
        customerData: paymentData.widgetConfig.customerData,
        shippingAddress: paymentData.widgetConfig.shippingAddress,
      });

      checkout.open((result: any) => {
        const transaction = result.transaction;

        if (transaction) {
          // Save transaction data
          updatePaymentData({
            transactionId: transaction.id,
            reference: transaction.reference,
          });

          // Redirect to result page
          navigate("/payment-result", {
            state: { transaction },
          });
        } else {
          setError("Transacción cancelada o no completada");
        }
      });
    } catch (err) {
      console.error("Error initializing widget:", err);
      setError("Error al inicializar el widget de pago");
    }
  };

  if (!paymentData.widgetConfig) {
    return null;
  }

  return (
    <div className="text-center">
      <h1>Procesando Pago</h1>

      {error ? (
        <div style={{ maxWidth: "500px", margin: "2rem auto" }}>
          <Alert type="error" message={error} />
          <button
            onClick={() => navigate("/checkout")}
            className="btn btn-primary mt-3"
          >
            Volver al checkout
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-muted mb-4">
            El widget de pago se abrirá automáticamente...
          </p>
          <div className="spinner spinner-lg"></div>

          <div
            className="card mt-4"
            style={{ maxWidth: "400px", margin: "0 auto" }}
          >
            <h3>Detalles del pago</h3>
            <p>
              <strong>Referencia:</strong> {paymentData.widgetConfig.reference}
            </p>
            <p>
              <strong>Monto:</strong> $
              {(paymentData.widgetConfig.amountInCents / 100).toLocaleString(
                "es-CO"
              )}{" "}
              COP
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
