import React from "react";
import { TagBadgeProps } from "./types";

export const TagBadge: React.FC<TagBadgeProps> = ({ title, type = false }) => {
  return (
    <div
      className={`
        px-[18px] py-[8px] rounded-[12px] 
        text-[17px] font-semibold w-fit
        ${type ? "bg-[#eef0ff] text-[#4b5cff]" : "bg-[#e6e6e6] text-[#333]"}
      `}
    >
      {title}
    </div>
  );
};
