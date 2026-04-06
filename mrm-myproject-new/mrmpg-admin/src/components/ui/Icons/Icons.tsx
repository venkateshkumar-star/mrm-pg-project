import React from "react";
import {
  Search,
  User,
  Users,
  Settings,
  Home,
  Bell,
  Mail,
  Phone,
  Calendar,
  Clock,
  Edit,
  Delete,
  Plus,
  Minus,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Download,
  Upload,
  File,
  Folder,
  Image,
  Video,
  Music,
  Save,
  Copy,
  Share,
  Heart,
  Star,
  Filter,
  Grid,
  List,
  Menu,
  MoreVertical,
  MoreHorizontal,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
  Trash2,
  Edit3,
  RefreshCw,
  LogOut,
  LogIn,
  Lock,
  Unlock,
  Wifi,
  WifiOff,
  Battery,
  Bluetooth,
  Camera,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MapPin,
  Globe,
  Car,
  Truck,
  Plane,
  Train,
  Bike,
  IndianRupee,
  UserPlus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  CreditCard,
  UserMinus,
  ActivityIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  XCircleIcon,
  AlertTriangleIcon,
  Loader2,
  UserCheck,
  Building,
  Hash,
  Shield,
  MessageCircle,
  XIcon,
  Target,
  IndianRupeeIcon,
  ReceiptIndianRupeeIcon,
  WalletIcon,

} from "lucide-react";
import type { types } from "@/types";

const iconMap = {
  // Navigation & UI
  search: Search,
  user: User,
  users: Users,
  settings: Settings,
  home: Home,
  bell: Bell,
  mail: Mail,
  phone: Phone,
  calendar: Calendar,
  clock: Clock,
  
  // Actions
  edit: Edit,
  delete: Delete,
  plus: Plus,
  minus: Minus,
  close: X,
  check: Check,
  save: Save,
  copy: Copy,
  share: Share,
  refresh: RefreshCw,
  
  // Arrows & Chevrons
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  
  // Visibility
  eye: Eye,
  eyeOff: EyeOff,
  
  // File Operations
  download: Download,
  upload: Upload,
  file: File,
  folder: Folder,
  image: Image,
  video: Video,
  music: Music,
  
  // Favorites & Rating
  heart: Heart,
  star: Star,
  
  // Layout & View
  filter: Filter,
  grid: Grid,
  list: List,
  menu: Menu,
  moreVertical: MoreVertical,
  moreHorizontal: MoreHorizontal,
  
  // Status & Alerts
  info: Info,
  warning: AlertCircle,
  success: CheckCircle,
  error: XCircle,
  help: HelpCircle,
  
  // Utilities
  trash: Trash2,
  edit3: Edit3,
  logout: LogOut,
  login: LogIn,
  lock: Lock,
  unlock: Unlock,
  
  // Connectivity & Media
  wifi: Wifi,
  wifiOff: WifiOff,
  battery: Battery,
  bluetooth: Bluetooth,
  camera: Camera,
  mic: Mic,
  micOff: MicOff,
  volume: Volume2,
  volumeOff: VolumeX,
  
  // Location & Transport
  location: MapPin,
  globe: Globe,
  car: Car,
  truck: Truck,
  plane: Plane,
  train: Train,
  bike: Bike,
  
  // Finance & Business
  indianRupee: IndianRupee,
  dollarSign: DollarSign,
  creditCard: CreditCard,
  
  // Trends & Analytics
  trendingUp: TrendingUp,
  trendingDown: TrendingDown,
  
  // Additional Actions
  userPlus: UserPlus,
  userMinus: UserMinus,
  fileText: FileText,
  activity: ActivityIcon,
  alertCircle: AlertCircleIcon,
  checkCircle2: CheckCircle2Icon,
  xCircle : XCircleIcon,
  alertTriangle: AlertTriangleIcon,
  
  // Loading
  loader: Loader2,
  userCheck: UserCheck,
  building: Building,
  shield: Shield,
  hash: Hash,
  messageCircle: MessageCircle,
  x: XIcon,
  target: Target,

  
  indianRupeeIcon: IndianRupeeIcon,
  receiptIndianRupeeIcon: ReceiptIndianRupeeIcon, 

  walletIcon: WalletIcon,

} as const;

const Icons: React.FC<types["IconProps"]> = ({
  name,
  size = 20,
  color = "currentColor",
  strokeWidth = 2,
  className = "icon",
  onClick,
  ...props
}) => {
  const IconComponent = iconMap[name as keyof typeof iconMap];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }
  
  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
      onClick={onClick}
      {...props}
    />
  );
};

export default Icons;