import React from "react";
import { StatusBadge } from "../StatusBadge";

interface PaymentCardProps {
  month?: string;
  paymentDate?: string;
  dueDate?: string;
  pending?: boolean;
  isSelected?: boolean;
  onPress?: () => void;
  width?: string | number;
  height?: string | number;
}

export const PaymentCard: React.FC<PaymentCardProps> = ({
  month = "",
  paymentDate = "",
  dueDate = "",
  pending = false,
  isSelected = false,
  onPress = () => {},
  width = "100%",
  height = "auto",
}) => {
  return (
    <div
      onClick={onPress}
      style={{
        width,
        height,
        padding: "10px",
        borderRadius: "15px",
        border: isSelected ? "none" : "2px solid #4A3AFF",
        backgroundColor: isSelected ? "#4A3AFF" : "#FFFFFF",
        color: isSelected ? "white" : "black",
        position: "relative",
        marginBottom: "20px",
        cursor: "pointer",
        transition: "0.2s",
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: "15px",
          fontWeight: 600,
          lineHeight: "28px",
        }}
      >
        {month}
      </h2>

      {paymentDate && (
        <p style={{ margin: "5px 0 0 0", fontSize: "15px", opacity: 0.9 }}>
          Paid on {paymentDate}
        </p>
      )}

      {dueDate && (
        <p style={{ margin: "5px 0 0 0", fontSize: "15px", opacity: 0.9 }}>
          Due {dueDate}
        </p>
      )}

      {pending && (
        <div
          style={{
            position: "absolute",
            right: "20px",
            top: "30px",
          }}
        >
          <StatusBadge title="Pending" />
        </div>
      )}
    </div>
  );
};
