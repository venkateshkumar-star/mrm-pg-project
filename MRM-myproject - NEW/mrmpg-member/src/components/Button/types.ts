export interface ButtonProps {
  title?: string;
  width?: string;
  height?: string;
  icon?: React.ReactNode | null;
  onPress?: () => void;
  backgroundColor?: string;
  borderRadius?: string;
  padding?: string;
  disabled?:boolean;
}
