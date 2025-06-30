// src/components/common/Alert.tsx
import React from "react";

interface AlertProps {
  type: "error" | "success" | "warning" | "info";
  message: string;
  onClose?: () => void;
}

export function Alert({ type, message, onClose }: AlertProps) {
  return (
    <div className={`alert alert-${type}`}>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            marginLeft: "auto",
            fontSize: "1.25rem",
            lineHeight: "1",
            opacity: 0.7,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
