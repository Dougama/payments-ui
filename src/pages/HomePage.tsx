// src/pages/HomePage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { paymentService } from "@/services/payment.service";
import { Alert } from "@/components/common/Alert";
import { env } from "@/config/environment";
import { getErrorMessage } from "@/utils/error-handler";

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCancelButton, setShowCancelButton] = useState(false);

  // Temporal: para probar el botón, descomenta la siguiente línea
  // useEffect(() => { setShowCancelButton(true); setError("Ya existe un pago en proceso. Puedes cancelarlo si deseas iniciar uno nuevo."); }, []);

  const handleStartTest = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setError("");
    setLoading(true);
    setShowCancelButton(false);

    try {
      // Get product data - this also validates payment status
      const productResponse = await paymentService.getProduct(
        env.get("TEST_PRODUCT_SKU"),
        user.uid,
        env.get("TEST_COUPON_CODE")
      );

      if (!productResponse.success) {
        throw new Error(productResponse.error || "Error al obtener producto");
      }

      // Check if payment is required
      if (productResponse.payment) {
        // Redirect to checkout
        navigate("/checkout", {
          state: { product: productResponse.product },
        });
      } else {
        // No payment required (100% discount or already paid)
        setError(
          "El producto tiene 100% de descuento o ya fue pagado. No se requiere pago."
        );
      }
    } catch (err: any) {
      console.error("Error en handleStartTest:", err);
      const errorMessage = getErrorMessage(err);

      // Check if it's a payment in progress error
      if (err.status === 409 || errorMessage.includes("pago en proceso")) {
        setShowCancelButton(true);
        setError(
          "Ya existe un pago en proceso. Puedes cancelarlo si deseas iniciar uno nuevo."
        );
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPayment = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await paymentService.cancelTransaction(user.uid);

      if (response.success) {
        setShowCancelButton(false);
        setError("");
        // Show success message and allow new test
        alert(
          "Pago cancelado exitosamente. Ahora puedes iniciar un nuevo test."
        );
      } else {
        throw new Error(response.message || "Error al cancelar el pago");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center">
      <h1>Bienvenido a Payments Test App</h1>

      {user ? (
        <div className="mt-4">
          <p className="text-muted mb-4">
            Hola {user.email}, estás listo para iniciar el test de pago.
          </p>

          {error && (
            <div style={{ maxWidth: "500px", margin: "0 auto" }}>
              <Alert
                type="error"
                message={error}
                onClose={() => setError("")}
              />
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              alignItems: "center",
              marginTop: "2rem",
            }}
          >
            <button
              onClick={handleStartTest}
              className="btn btn-primary"
              disabled={loading}
              style={{
                fontSize: "1.25rem",
                padding: "1rem 2rem",
                minWidth: "250px",
              }}
            >
              {loading ? <span className="spinner" /> : "Iniciar el test"}
            </button>

            {showCancelButton && (
              <button
                onClick={handleCancelPayment}
                className="btn btn-danger"
                disabled={loading}
                style={{
                  fontSize: "1rem",
                  padding: "0.75rem 1.5rem",
                  minWidth: "250px",
                }}
              >
                {loading ? (
                  <span className="spinner" />
                ) : (
                  "Cancelar pago en proceso"
                )}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-muted mb-4">
            Por favor inicia sesión para continuar con el test.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="btn btn-primary"
          >
            Iniciar sesión
          </button>
        </div>
      )}
    </div>
  );
}
