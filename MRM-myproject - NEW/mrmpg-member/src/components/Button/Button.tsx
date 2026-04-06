

import React from "react";
import { ButtonProps } from "./types";

export const Button: React.FC<ButtonProps> = ({
  title = "Pay Now",
  width = "200px",
  height = "60px",
  icon = null,
  onPress = () => {},
  backgroundColor = "#EC595F",
  borderRadius = "5px",
  padding = "10px",
  disabled = false, // ✅ FIXED
}) => {
  return (
    <button
      onClick={onPress}
      disabled={disabled} // ✅ FIXED
      style={{
        width,
        height,
        backgroundColor: disabled ? "#9CA3AF" : backgroundColor,
        borderRadius,
        border: "none",
        padding, // ✅ FIXED
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      

      <span
        style={{
          color: "white",
          fontSize: "18px",
          fontWeight: 600,
        }}
      >
        {title}
      </span>
      {icon && (
        <span style={{ display: "flex", alignItems: "center" }}>
          {icon}
        </span>
      )}
    </button>
  );
};
