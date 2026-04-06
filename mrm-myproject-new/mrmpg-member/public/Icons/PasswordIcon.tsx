import * as React from "react";

export const PasswordIcon = ({
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
      d="M12 1a5 5 0 0 0-5 5v3H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-2V6a5 5 0 0 0-5-5m-3 8V6a3 3 0 0 1 6 0v3z"
    />
  </svg>
);
