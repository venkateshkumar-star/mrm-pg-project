

import React from "react";
import { StatusBadge } from "../StatusBadge";
import { RentCardProps } from "./types";

export const RentCard: React.FC<RentCardProps> = ({
  heading,
  price,
  dueDate,
  description,
  status = "Pending",
  width = "100%",
  height = "auto",
}) => {
  return (
    <div
      className="
        bg-white p-8 border border-[#e2e2e2] rounded-[20px] box-border
      "
      style={{ width, height }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] md:text-xl font-bold m-0">{heading}</h2>
        <StatusBadge title={status} />
      </div>

      {/* Price */}
      <h1 className="text-[20px] md:text-xl font-bold mt-6 mb-2">{price}</h1>

      {/* Due Date */}
      <p className="text-[16px] mb-6">Due: {dueDate}</p>

      {/* Divider */}
      <hr className="border-t border-black" />

      {/* Description */}
      <p className="text-[17px] mt-4">{description}</p>
    </div>
  );
};

