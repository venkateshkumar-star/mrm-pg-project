export const UploadIcon = ({
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
      d="M12 2l5 5h-3v6h-4V7H7zM4 18h16v2H4z"
    />
  </svg>
);