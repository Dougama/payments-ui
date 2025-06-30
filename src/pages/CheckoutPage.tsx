// src/pages/CheckoutPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePayment } from "@/contexts/PaymentContext";
import { paymentService } from "@/services/payment.service";
import { DataGenerator } from "@/utils/data-generator";
import { Alert } from "@/components/common/Alert";
import { getErrorMessage } from "@/utils/error-handler";
import { CheckoutRequest } from "@/types/payment.types";
import { env } from "@/config/environment";

export function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { updatePaymentData } = usePayment();
  const product = location.state?.product;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<CheckoutRequest>({
    sku: env.get("TEST_PRODUCT_SKU"),
    coupon_code: env.get("TEST_COUPON_CODE"),
    customerData: {
      email: "",
      fullName: "",
      phoneNumber: "",
      phoneNumberPrefix: "+57",
      legalId: "",
      legalIdType: "CC",
    },
    shippingAddress: {
      addressLine1: "",
      city: "",
      region: "",
      phoneNumber: "",
      country: "Colombia",
    },
  });

  // Auto-fill with random data on mount
  useEffect(() => {
    if (!product) {
      navigate("/");
      return;
    }

    const generatedData = DataGenerator.generateCheckoutData();
    setFormData((prev) => ({
      ...prev,
      customerData: generatedData.customerData,
      shippingAddress: generatedData.shippingAddress,
    }));
  }, [product, navigate]);

  const handleCustomerDataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      customerData: {
        ...prev.customerData,
        [name]: value,
      },
    }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      shippingAddress: {
        ...prev.shippingAddress,
        [name]: value,
      },
    }));
  };

  const generateNewData = () => {
    const generatedData = DataGenerator.generateCheckoutData();
    setFormData((prev) => ({
      ...prev,
      customerData: generatedData.customerData,
      shippingAddress: generatedData.shippingAddress,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      const response = await paymentService.checkout(user.uid, formData);

      if (!response.success) {
        throw new Error(response.error || "Error al procesar checkout");
      }

      // Save payment data to context
      updatePaymentData({
        widgetConfig: response.data,
        productData: product,
        checkoutData: formData,
      });

      // Redirect to payment page
      navigate("/payment");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return null;
  }

  return (
    <div>
      <h1 className="text-center mb-4">Checkout</h1>

      <div className="card mb-3">
        <div className="card-header">
          <h3 className="card-title">Producto</h3>
        </div>
        <div>
          <p>
            <strong>{product.name}</strong>
          </p>
          <p>Precio: ${product.total.toLocaleString("es-CO")} COP</p>
          {product.discount > 0 && (
            <p className="text-success">
              Descuento aplicado: {product.discount}%
            </p>
          )}
        </div>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError("")} />
      )}

      <form
        onSubmit={handleSubmit}
        className="form"
        style={{ maxWidth: "600px" }}
      >
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Datos del cliente</h3>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              value={formData.customerData.email}
              onChange={handleCustomerDataChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="fullName">
              Nombre completo *
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              className="form-input"
              value={formData.customerData.fullName}
              onChange={handleCustomerDataChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phoneNumber">
              Teléfono *
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                className="form-input"
                value="+57"
                disabled
                style={{ width: "80px" }}
              />
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                className="form-input"
                value={formData.customerData.phoneNumber}
                onChange={handleCustomerDataChange}
                required
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="legalIdType">
              Tipo de documento *
            </label>
            <select
              id="legalIdType"
              name="legalIdType"
              className="form-select"
              value={formData.customerData.legalIdType}
              onChange={handleCustomerDataChange}
              required
            >
              <option value="CC">Cédula de ciudadanía</option>
              <option value="CE">Cédula de extranjería</option>
              <option value="NIT">NIT</option>
              <option value="PP">Pasaporte</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="legalId">
              Número de documento *
            </label>
            <input
              id="legalId"
              name="legalId"
              type="text"
              className="form-input"
              value={formData.customerData.legalId}
              onChange={handleCustomerDataChange}
              required
            />
          </div>
        </div>

        <div className="card mt-3">
          <div className="card-header">
            <h3 className="card-title">Dirección de envío</h3>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="addressLine1">
              Dirección *
            </label>
            <input
              id="addressLine1"
              name="addressLine1"
              type="text"
              className="form-input"
              value={formData.shippingAddress.addressLine1}
              onChange={handleAddressChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="city">
              Ciudad *
            </label>
            <input
              id="city"
              name="city"
              type="text"
              className="form-input"
              value={formData.shippingAddress.city}
              onChange={handleAddressChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="region">
              Departamento *
            </label>
            <input
              id="region"
              name="region"
              type="text"
              className="form-input"
              value={formData.shippingAddress.region}
              onChange={handleAddressChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="shippingPhone">
              Teléfono de contacto *
            </label>
            <input
              id="shippingPhone"
              name="phoneNumber"
              type="tel"
              className="form-input"
              value={formData.shippingAddress.phoneNumber}
              onChange={handleAddressChange}
              required
            />
          </div>
        </div>

        <div
          className="mt-3"
          style={{ display: "flex", gap: "1rem", flexDirection: "column" }}
        >
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : "Proceder al pago"}
          </button>

          <button
            type="button"
            onClick={generateNewData}
            className="btn btn-secondary btn-block"
            disabled={loading}
          >
            Generar datos aleatorios
          </button>
        </div>
      </form>
    </div>
  );
}
