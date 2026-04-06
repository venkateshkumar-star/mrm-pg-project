import React from "react";
import { StatusBadge } from "../StatusBadge";

type RentStatus = "upload" | "pending" | "overdue" | "Rejected";

interface RentStatusCardProps {
  month: string;
  status: RentStatus;
  amount: number;
  message?: string;
}

export const RentStatusCard: React.FC<RentStatusCardProps> = ({
  month,
  status,
  amount,
  message = "Pay this month's rent to avoid late charges.",
}) => {
  return (
    <div
      style={{
        width: "100%",
        background: "#FFFFFF",
        borderRadius: "14px",
        padding: "20px 24px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 24,
          fontSize: "20px",
          fontWeight: 600,
          color: "#111",
        }}
      >
        ₹{amount.toLocaleString()}
      </div>
      <div>
        <h3
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: 600,
            color: "#111",
          }}
        >
          {month}
        </h3>
        <div
          style={{
            marginTop: 6,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: "14px",
              color: "#555",
              fontWeight: 500,
            }}
          >
            Status:
          </span>

          <StatusBadge
            title={status.charAt(0).toUpperCase() + status.slice(1)}
            width="80px"
            height="24px"
          />
        </div>
        <p
          style={{
            marginTop: 10,
            marginBottom: 0,
            fontSize: "14px",
            color: "#6B7280",
            maxWidth: "520px",
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
};
