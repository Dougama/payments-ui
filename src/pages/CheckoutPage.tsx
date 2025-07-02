// src/pages/CheckoutPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePayment } from "@/contexts/PaymentContext";
import { paymentService } from "@/services/payment.service";
import { DataGenerator } from "@/utils/data-generator";
import { userDataStore } from "@/utils/user-data-store";
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
  const [loadingCoupon, setLoadingCoupon] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [originalProduct, setOriginalProduct] = useState(product);
  const [discountedProduct, setDiscountedProduct] = useState(product);
  const [formData, setFormData] = useState<CheckoutRequest>({
    sku: env.get("TEST_PRODUCT_SKU"),
    coupon_code: undefined,
    customerData: {
      email: "",
      firstName: "",
      lastName: "",
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
      country: "Colombia",
      phoneNumber: "", // Agregado phoneNumber
    },
  });

  // Auto-fill with user data or random data on mount
  useEffect(() => {
    if (!product || !user) {
      navigate("/");
      return;
    }

    // Guardar el producto original
    setOriginalProduct(product);
    setDiscountedProduct(product);

    // Si tenemos datos del usuario, usarlos primero
    const userEmail = user.email || "";
    if (userEmail) {
      // Generar datos aleatorios para el resto
      const generatedData = DataGenerator.generateCheckoutData();

      // Separar el fullName generado en firstName y lastName
      const nameParts = generatedData.customerData.fullName.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      setFormData((prev) => ({
        ...prev,
        customerData: {
          ...generatedData.customerData,
          email: userEmail, // Usar el email del usuario autenticado
          firstName,
          lastName,
        },
        shippingAddress: generatedData.shippingAddress,
      }));
    } else {
      // Si no hay email, generar todo aleatoriamente
      const generatedData = DataGenerator.generateCheckoutData();

      // Separar el fullName generado en firstName y lastName
      const nameParts = generatedData.customerData.fullName.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      setFormData((prev) => ({
        ...prev,
        customerData: {
          ...generatedData.customerData,
          firstName,
          lastName,
        },
        shippingAddress: generatedData.shippingAddress,
      }));
    }
  }, [product, navigate, user]);

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
    const userEmail = user?.email || generatedData.customerData.email;

    // Separar el fullName generado en firstName y lastName
    const nameParts = generatedData.customerData.fullName.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    setFormData((prev) => ({
      ...prev,
      customerData: {
        ...generatedData.customerData,
        email: userEmail, // Asegurar que siempre sea string
        firstName,
        lastName,
      },
      shippingAddress: generatedData.shippingAddress,
    }));
    setError("");
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError("Por favor ingresa un código de cupón");
      return;
    }

    if (!user) {
      setError("Usuario no autenticado");
      return;
    }

    setError("");
    setLoadingCoupon(true);

    try {
      // Verificar el cupón llamando al endpoint de producto con el cupón
      const response = await paymentService.getProduct(
        env.get("TEST_PRODUCT_SKU"),
        user.uid,
        couponCode
      );

      if (!response.success) {
        // Manejar diferentes tipos de errores
        if (response.error?.includes("ya ha sido redimido")) {
          setError("Este cupón ya ha sido utilizado");
        } else if (response.error?.includes("no válido")) {
          setError("Código de cupón no válido");
        } else if (response.error?.includes("expirado")) {
          setError("Este cupón ha expirado");
        } else {
          setError(response.error || "Error al aplicar el cupón");
        }
        return;
      }

      if (response.product) {
        // Actualizar el producto con el descuento aplicado
        setDiscountedProduct(response.product);
        setCouponApplied(true);

        // Actualizar el formData con el código de cupón
        setFormData((prev) => ({
          ...prev,
          coupon_code: couponCode,
        }));

        // Mostrar mensaje de éxito
        if (response.product.discount && response.product.discount > 0) {
          setError(""); // Limpiar errores
          alert(`¡Cupón aplicado! Descuento del ${response.product.discount}%`);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setCouponCode("");
    setCouponApplied(false);
    setDiscountedProduct(originalProduct);
    setFormData((prev) => ({
      ...prev,
      coupon_code: undefined,
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

      // Preparar datos para el checkout - aquí SÍ enviamos firstName y lastName
      const checkoutData = {
        ...formData,
        customerData: {
          ...formData.customerData,
          fullName:
            `${formData.customerData.firstName} ${formData.customerData.lastName}`.trim(),
        },
        shippingAddress: {
          ...formData.shippingAddress,
          phoneNumber: formData.customerData.phoneNumber, // Copiar el phoneNumber a shippingAddress
        },
        coupon_code: couponApplied ? couponCode : undefined,
      };

      // Guardar datos del usuario para futuras compras (con firstName y lastName separados)
      if (user) {
        userDataStore.saveUserData(user.uid, formData.customerData);
      }

      const response = await paymentService.checkout(user.uid, checkoutData);

      if (!response.success) {
        throw new Error(response.error || "Error al procesar el pago");
      }

      if (response.data) {
        // Update payment context
        updatePaymentData({
          widgetConfig: response.data,
          productData: discountedProduct,
        });

        // Redirect to payment page
        navigate("/payment");
      } else {
        // No payment needed (100% discount)
        navigate("/payment-result", {
          state: {
            transaction: {
              status: "APPROVED",
              reference: checkoutData.customerData.fullName,
              id: `test-${Date.now()}`,
            },
          },
        });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!product || !user) {
    return null;
  }

  return (
    <div>
      <h1 className="text-center mb-4">Checkout</h1>

      {/* Información del producto */}
      <div
        className="card mb-3"
        style={{ maxWidth: "600px", margin: "0 auto" }}
      >
        <div className="card-header">
          <h3 className="card-title">Resumen del pedido</h3>
        </div>
        <div>
          <h4>{discountedProduct.name}</h4>
          {discountedProduct.discount && discountedProduct.discount > 0 ? (
            <div>
              <p style={{ textDecoration: "line-through", color: "#666" }}>
                Precio original: $
                {originalProduct.total.toLocaleString("es-CO")} COP
              </p>
              <p className="text-success">
                Precio con descuento: $
                {discountedProduct.total.toLocaleString("es-CO")} COP
                <span className="badge badge-success ml-2">
                  -{discountedProduct.discount}%
                </span>
              </p>
            </div>
          ) : (
            <p>
              Precio: ${discountedProduct.total.toLocaleString("es-CO")} COP
            </p>
          )}
        </div>
      </div>

      {/* Sección de cupón */}
      <div className="card mb-3">
        <div className="card-header">
          <h3 className="card-title">Cupón de descuento</h3>
        </div>
        <div>
          {!couponApplied ? (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                className="form-input"
                placeholder="Ingresa tu código de cupón"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                disabled={loadingCoupon}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="btn btn-secondary"
                disabled={loadingCoupon || !couponCode.trim()}
              >
                {loadingCoupon ? <span className="spinner" /> : "Aplicar"}
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <p className="text-success mb-0">
                <strong>Cupón aplicado:</strong> {couponCode}
              </p>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="btn btn-outline"
              >
                Quitar cupón
              </button>
            </div>
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
            <label className="form-label" htmlFor="firstName">
              Nombre *
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              className="form-input"
              value={formData.customerData.firstName}
              onChange={handleCustomerDataChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="lastName">
              Apellido *
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              className="form-input"
              value={formData.customerData.lastName}
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
            <label className="form-label" htmlFor="department">
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
