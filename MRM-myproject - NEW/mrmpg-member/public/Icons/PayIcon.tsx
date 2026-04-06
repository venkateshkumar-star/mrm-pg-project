import * as React from "react";

interface PayIconProps extends React.SVGProps<SVGSVGElement> {
  width?: number | string;
  height?: number | string;
  fill?: string;
}

export const PayIcon: React.FC<PayIconProps> = ({
  width = 24,
  height = 24,
  fill = "#e3e3e3",
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 -960 960 960"
      fill={fill}
      {...props}
    >
      <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160zm0-80h640v-480H160v480zm40-40h400L400-680H200v400zm320-320h240v-80H520v80zM160-240v-480 480z" />
    </svg>
  );
};
