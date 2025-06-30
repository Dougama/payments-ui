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

  const handleStartTest = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Get product data
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
        // No payment required (100% discount)
        setError("El producto tiene 100% de descuento. No se requiere pago.");
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

          <button
            onClick={handleStartTest}
            className="btn btn-primary"
            disabled={loading}
            style={{ fontSize: "1.25rem", padding: "1rem 2rem" }}
          >
            {loading ? <span className="spinner" /> : "Iniciar el test"}
          </button>
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
