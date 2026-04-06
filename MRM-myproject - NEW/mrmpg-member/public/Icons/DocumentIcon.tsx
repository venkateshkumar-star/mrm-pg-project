import * as React from "react";

export const DocumentIcon = ({
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
    fill="none"
    style={style}
    viewBox="0 0 24 30"
    {...rest}
  >
    <path
      fill={fill}
      d="M3.375 0A3.38 3.38 0 0 0 0 3.375v23.25A3.38 3.38 0 0 0 3.375 30h17.25A3.38 3.38 0 0 0 24 26.625V12h-8.625A3.38 3.38 0 0 1 12 8.625V0zM14.25.66v7.965c0 .62.505 1.125 1.125 1.125h7.966zM7.125 15.75h9.75a1.125 1.125 0 0 1 0 2.25h-9.75a1.125 1.125 0 0 1 0-2.25M7.118 21h6.747a1.125 1.125 0 0 1 .154 2.24l-.153.01H7.12a1.125 1.125 0 0 1-.154-2.24z"
    ></path>
  </svg>
);
