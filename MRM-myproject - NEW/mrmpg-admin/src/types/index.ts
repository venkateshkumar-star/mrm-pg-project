interface Menu {
  id: string;
  layout: "root" | "entity" | "image";
  label: string;
  path: string;
  tabs?: Menu[];
  selected?: boolean;
  image?: React.ReactNode;
  class: string;
}

// Filter types
type FilterType =
  | "text"
  | "search"
  | "select"
  | "multiSelect"
  | "date"
  | "dateRange"
  | "number"
  | "checkbox"
  | "radio";

interface FilterOptionProps {
  label: string;
  value: string;
  disabled?: boolean;
}

type FilterValue =
  | string
  | string[]
  | number
  | boolean
  | Date
  | { start: string; end: string }
  | null;

interface FilterItemProps {
  id: string;
  type: FilterType;
  label?: string;
  placeholder?: string;
  options?: FilterOptionProps[];
  actionKey?: string[];
  defaultValue?: FilterValue;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  gridSpan?: number;
  min?: number | string;
  max?: number | string;
  step?: number;
  multiSelect?: boolean;
  className?: string;
  style?: React.CSSProperties;
  validation?: (value: FilterValue) => string | null;
  onChange?: (id: string, value: FilterValue | string[]) => void;
  value?: string[];
  onFocus?: () => void;
  onBlur?: () => void;
  // MultiSelect dropdown props
  variant?: "list" | "dropdown" | "native" | "custom";
  searchable?: boolean;
  maxDisplayItems?: number;
  showSelectAll?: boolean;
}

interface FilterLayoutProps {
  title?: string;
  filters: FilterItemProps[];
  layout?: "horizontal" | "vertical" | "grid" | "inline";
  columns?: number;
  spacing?: "small" | "medium" | "large" | "compact";
  showResetButton?: boolean;
  onReset?: () => void;
  onChange?: (id: string, value: FilterValue) => void;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  downloadReport?: boolean;
  onDownloadReport?: () => void;
  loading?: boolean;
}

// Icon types
export type IconName =
  | "search"
  | "user"
  | "users"
  | "settings"
  | "home"
  | "bell"
  | "mail"
  | "phone"
  | "calendar"
  | "clock"
  | "edit"
  | "delete"
  | "plus"
  | "minus"
  | "close"
  | "check"
  | "save"
  | "copy"
  | "share"
  | "refresh"
  | "chevronDown"
  | "chevronUp"
  | "chevronLeft"
  | "chevronRight"
  | "arrowLeft"
  | "arrowRight"
  | "arrowUp"
  | "arrowDown"
  | "eye"
  | "eyeOff"
  | "download"
  | "upload"
  | "file"
  | "folder"
  | "image"
  | "video"
  | "music"
  | "heart"
  | "star"
  | "filter"
  | "grid"
  | "list"
  | "menu"
  | "moreVertical"
  | "moreHorizontal"
  | "info"
  | "warning"
  | "success"
  | "error"
  | "help"
  | "trash"
  | "edit3"
  | "logout"
  | "login"
  | "lock"
  | "unlock"
  | "wifi"
  | "wifiOff"
  | "battery"
  | "bluetooth"
  | "camera"
  | "mic"
  | "micOff"
  | "volume"
  | "volumeOff"
  | "location"
  | "globe"
  | "car"
  | "truck"
  | "plane"
  | "train"
  | "bike"
  | "indianRupee"
  | "userPlus"
  | "dollarSign"
  | "trendingUp"
  | "trendingDown"
  | "fileText"
  | "creditCard"
  | "checkCircle"
  | "activity"
  | "alertCircle"
  | "userMinus"
  | "checkCircle2"
  | "xCircle"
  | "alertTriangle"
  | "loader"
  | "userCheck"
  | "hash"
  | "shield"
  | "building"
  | "x"
  | "target"
  | "indianRupeeIcon"
  | "receiptIndianRupeeIcon"
  | "walletIcon";

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  onClick?: () => void;
}

// Table types
interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (
    value: unknown,
    row: Record<string, unknown>,
    index: number
  ) => React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

interface TableData {
  [key: string]: unknown;
}

interface TableLayoutProps {
  columns: TableColumn[];
  data: TableData[];
  loading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
  pageSize?: number;
  sortable?: boolean;
  currentSort?: {
    key: string | null;
    direction: "asc" | "desc";
  };
  className?: string;
  onRowClick?: (row: TableData, index: number) => void;
  onSort?: (key: string, direction: "asc" | "desc") => void;
  emptyMessage?: string;
  // Checkbox functionality
  showCheckboxes?: boolean;
  selectedRows?: (string | number)[];
  onSelectionChange?: (
    selectedIds: (string | number)[],
    selectedRows: TableData[]
  ) => void;
  rowIdField?: string; // Field to use as unique identifier for rows (default: 'id')
  // Refresh functionality
  showRefresh?: boolean;
  showLastUpdated?: boolean;
  lastUpdated?: Date | string;
  onRefresh?: () => void;
  refreshLoading?: boolean;
}

interface ActionButton {
  label: string;
  icon?: types["IconName"];
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
  onClick: () => void;
  disabled?: boolean;
}

interface CardLayoutProps {
  title: string;
  value: string | number;
  icon: types["IconName"];
  percentage?: number;
  trend?: "up" | "down" | "neutral";
  color?: "primary" | "success" | "warning" | "error" | "info";
  className?: string;
  onClick?: () => void;
  loading?: boolean;
  subtitle?: string;

  actions?: ActionButton[];
  showActions?: "always" | "hover" | "never";
  customContent?: React.ReactNode;
  footer?: React.ReactNode;
  badge?: {
    text: string;
    color?: "primary" | "success" | "warning" | "error" | "info";
  };
  style?: React.CSSProperties;
}

interface HeaderButton {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

interface HeaderLayoutProps {
  title: string;
  subText?: string;
  pageInfo?: string;
  buttons?: HeaderButton[];
}

interface types {
  Menu: Menu;
  FilterOptionProps: FilterOptionProps;
  FilterItemProps: FilterItemProps;
  FilterLayoutProps: FilterLayoutProps;
  IconName: IconName;
  IconProps: IconProps;
  TableColumn: TableColumn;
  TableData: TableData;
  TableLayoutProps: TableLayoutProps;
  CardLayoutProps: CardLayoutProps;
  ActionButtonProps: ActionButton;
  HeaderButton: HeaderButton;
  HeaderLayoutProps: HeaderLayoutProps;
}
export type { types };
