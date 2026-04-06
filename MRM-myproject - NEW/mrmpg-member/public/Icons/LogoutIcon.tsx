import * as React from "react";

interface LogoutIconProps extends React.SVGProps<SVGSVGElement> {
  width?: number | string;
  height?: number | string;
}

export const LogoutIcon: React.FC<LogoutIconProps> = ({
  width = 20,
  height = 20,
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Door */}
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    {/* Arrow */}
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);
