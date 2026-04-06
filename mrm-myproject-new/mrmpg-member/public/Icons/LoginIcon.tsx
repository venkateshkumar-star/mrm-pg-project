export const LoginIcon = ({
  width = "20",
  height = "20",
  fill = "#fff",
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
      d="M16 17v-2H7V9h9V7l5 5zM4 3h8v2H4v14h8v2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2"
    />
  </svg>
);
