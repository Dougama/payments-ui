// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PaymentProvider } from "@/contexts/PaymentContext";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { CheckoutPage } from "@/pages/CheckoutPage";
import { PaymentPage } from "@/pages/PaymentPage";
import { PaymentResultPage } from "@/pages/PaymentResultPage";
import "@/styles/global.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PaymentProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />

              <Route
                path="checkout"
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="payment"
                element={
                  <ProtectedRoute>
                    <PaymentPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="payment-result"
                element={
                  <ProtectedRoute>
                    <PaymentResultPage />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </PaymentProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
