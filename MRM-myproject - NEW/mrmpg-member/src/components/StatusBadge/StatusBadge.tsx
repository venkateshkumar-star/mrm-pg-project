import React from "react";
import { StatusBadgeProps } from "./types";
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  title,
  width = "90px",
  height = "25px",
}) => {
  const backgroundColor =
    title?.toLowerCase() === "pending"
      ? "#E57A2F"
      : title?.toLowerCase() === "paid" || title?.toLowerCase() === "upload"
      ? "#2F9E44"
      : title?.toLowerCase() === "under review"
      ? "#FBBF24"
      : title?.toLowerCase() === "rejected"
      ? "#FF5050"
      : "#6b6b6b";

      //Rejected
  return (
    <div
      style={{
        backgroundColor,
        width,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50px",
        color: "white",
        fontSize: "15px",
        fontWeight: "500",
      }}
    >
      {title}
    </div>
  );
};
