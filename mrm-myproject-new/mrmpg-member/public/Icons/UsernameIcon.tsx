import * as React from "react";

export const UsernameIcon = ({
  width = "20",
  height = "20",
  fill = "#000",
  style = {},
  ...rest
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    style={style}
    {...rest}
  >
    <path
      fill={fill}
      d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5m0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5"
    />
  </svg>
);