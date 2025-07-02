// src/pages/PaymentPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePayment } from "@/contexts/PaymentContext";
import { Alert } from "@/components/common/Alert";
import { userDataStore } from "@/utils/user-data-store";
import { useAuth } from "@/contexts/AuthContext";

declare global {
  interface Window {
    WidgetCheckout: any;
  }
}

export function PaymentPage() {
  const { user } = useAuth();
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
    script.type = "text/javascript";
    script.src = "https://checkout.wompi.co/widget.js";
    script.async = true;
    script.onload = () => {
      console.log("Wompi widget script loaded successfully");
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.error("Failed to load Wompi widget script");
      setError("Error al cargar el widget de pago");
    };

    // Add to head instead of body
    document.head.appendChild(script);

    return () => {
      // Remove from head
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [paymentData, navigate]);

  useEffect(() => {
    if (scriptLoaded && paymentData.widgetConfig) {
      initializeWidget();
    }
  }, [scriptLoaded, paymentData.widgetConfig]);

  const initializeWidget = () => {
    try {
      console.log(
        "Initializing Wompi widget with config:",
        paymentData.widgetConfig
      );

      // Verificar que tenemos los datos mínimos necesarios
      if (!paymentData.widgetConfig.publicKey) {
        throw new Error("No se encontró la clave pública de Wompi");
      }

      if (!paymentData.widgetConfig.signature?.integrity) {
        throw new Error("No se encontró la firma de integridad");
      }

      // Limpiar y formatear los datos correctamente
      const publicKey = paymentData.widgetConfig.publicKey.replace(/['"]/g, ""); // Remover comillas
      const amountInCents = parseInt(
        paymentData.widgetConfig.amountInCents.toString()
      ); // Asegurar que sea número
      const reference = paymentData.widgetConfig.reference.replace(/['"]/g, ""); // Remover comillas
      const integrity = paymentData.widgetConfig.signature.integrity.replace(
        /['"]/g,
        ""
      ); // Remover comillas

      // Construir solo con los campos obligatorios primero
      const widgetData: any = {
        currency: "COP",
        amountInCents: amountInCents,
        reference: reference,
        publicKey: publicKey,
        signature: {
          integrity: integrity,
        },
        // IMPORTANTE: Usar la URL que viene del backend
        redirectUrl: `${window.location.origin}/payment-result`,
      };

      // Si tenemos datos del cliente, agregarlos PERO FILTRAR firstName y lastName
      if (paymentData.widgetConfig.customerData) {
        // Desestructurar para excluir firstName y lastName
        const { firstName, lastName, ...customerDataForWidget } = paymentData
          .widgetConfig.customerData as any;
        widgetData.customerData = customerDataForWidget;
      }

      // Si tenemos dirección de envío, agregarla
      if (paymentData.widgetConfig.shippingAddress) {
        widgetData.shippingAddress = paymentData.widgetConfig.shippingAddress;
      }

      // Guardar la referencia en el store antes de abrir el widget
      if (user && reference) {
        userDataStore.saveUserData(user.uid, {
          lastPaymentReference: reference,
        });
      }

      console.log("Widget data cleaned:", widgetData);

      // Guardar la referencia antes de abrir el widget para recuperarla después
      if (widgetData.reference) {
        sessionStorage.setItem("payment_reference", widgetData.reference);
      }

      const checkout = new window.WidgetCheckout(widgetData);

      checkout.open((result: any) => {
        console.log("Wompi transaction result:", result);

        if (result && result.transaction) {
          // Save transaction data
          updatePaymentData({
            transactionId: result.transaction.id,
            reference:
              result.transaction.reference ||
              paymentData.widgetConfig.reference,
          });

          // Si Wompi redirecciona automáticamente, esto puede no ejecutarse
          // pero lo dejamos por si acaso
          navigate("/payment-result", {
            state: { transaction: result.transaction },
          });
        } else {
          // El usuario cerró el widget sin completar el pago
          console.log("Payment cancelled by user");
          setError("Pago cancelado por el usuario");
          setTimeout(() => {
            navigate("/");
          }, 3000);
        }
      });
    } catch (err: any) {
      console.error("Error initializing widget:", err);
      const errorMessage = err?.message || "Error desconocido";
      setError(`Error al inicializar el widget de pago: ${errorMessage}`);
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
