// src/contexts/PaymentContext.tsx
import React, { createContext, useContext, useState } from "react";

interface PaymentData {
  transactionId?: string;
  reference?: string;
  widgetConfig?: any;
  productData?: any;
  checkoutData?: any;
}

interface PaymentContextType {
  paymentData: PaymentData;
  setPaymentData: (data: PaymentData) => void;
  updatePaymentData: (data: Partial<PaymentData>) => void;
  clearPaymentData: () => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export function usePayment() {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error("usePayment must be used within a PaymentProvider");
  }
  return context;
}

interface PaymentProviderProps {
  children: React.ReactNode;
}

export function PaymentProvider({ children }: PaymentProviderProps) {
  const [paymentData, setPaymentData] = useState<PaymentData>({});

  const updatePaymentData = (data: Partial<PaymentData>) => {
    setPaymentData((prev) => ({ ...prev, ...data }));
  };

  const clearPaymentData = () => {
    setPaymentData({});
  };

  const value: PaymentContextType = {
    paymentData,
    setPaymentData,
    updatePaymentData,
    clearPaymentData,
  };

  return (
    <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>
  );
}
