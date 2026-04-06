import React, { useState } from "react";
import { StatusBadge } from "../StatusBadge";
import { CloseIcon } from "../../../public/Icons/CloseIcon";
import { EyeIcon } from "lucide-react";

export const PaymentStatusPopup = ({
  status = "Under Review",
  description = "Once you upload, the status changes to Under Review automatically. If rejected, you can upload again. Once approved, re-uploads are disabled.",
  submittedOn = "Dec 02, 2025 – 11:21 AM",
  billingMonth = "December 2025",
  popupWidth = "920",
  previewHeight = "230",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "20px",
        backgroundColor: "#fff",
        height: "200px",
        margin: "0 auto 20px auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <span style={{ fontSize: "18px", fontWeight: 600 }}>Current Status</span>

        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            border: "1px solid #000",
            borderRadius: "8px",
            padding: "5px 12px",
            background: "white",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          <EyeIcon /> View Status
        </button>
      </div>

      <div style={{ height: "1px", backgroundColor: "#ddd", marginBottom: "16px" }} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <span style={{ fontWeight: 500 }}>Your Payment Status</span>
        <StatusBadge title={status} width="130px" height="30px" />
      </div>
      <p style={{ marginTop: "10px", color: "#444", fontSize: "15px" }}>{description}</p>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "15px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: `${popupWidth}px`,
              background: "#fff",
              borderRadius: "20px",
              padding: "35px",
              position: "relative",
              overflowY: "auto",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <button
              onClick={() => setIsOpen(false)}
              style={{
                position: "absolute",
                top: "18px",
                right: "18px",
                background: "white",
                border: "1px solid black",
                borderRadius: "8px",
                padding: "5px 12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              <CloseIcon /> Close
            </button>

            <h3 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "15px" }}>
              Payment Verification Status
            </h3>
            <p style={{ color: "#444", marginBottom: "25px", lineHeight: "22px" }}>
              {description}
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "25px",
                borderRadius: "20px",
                border: "1px solid #ddd",
                background: "#fff",
                marginBottom: "30px",
                gap: "20px",
              }}
            >
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "15px", fontWeight: 600 }}>Current Status</span>
                <div style={{ marginTop: "8px" }}>
                  <StatusBadge title={status} width="140px" height="30px" />
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "15px", fontWeight: 600 }}>Submitted On</span>
                <div style={{ marginTop: "8px", fontWeight: 700 }}>{submittedOn}</div>
              </div>

              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "15px", fontWeight: 600 }}>Billing Month</span>
                <div style={{ marginTop: "8px", fontWeight: 700 }}>{billingMonth}</div>
              </div>
            </div>

            <div
              style={{
                width: "100%",
                height: `${previewHeight}px`,
                border: "1px solid #ddd",
                borderRadius: "20px",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1e40af",
                fontWeight: 700,
                fontSize: "16px",
              }}
            >
              Uploaded receipt preview
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
