import type { IconName } from ".";
import type { types } from ".";

// Base API Response interface
export interface BaseApiResponse {
  success: boolean;
  message: string;
  error?: string;
}

// Login related types
type PgType = "MENS" | "WOMENS";
type PaymentStatusTypes = "PENDING" | "PAID" | "REJECTED" | "OVERDUE";
type ApprovalStatusTypes = "PENDING" | "APPROVED" | "REJECTED";
type RentType = "LONG_TERM" | "SHORT_TERM";

export type PaginatedResponse<T> = BaseApiResponse & {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type AdminResponse = {
  id: string;
  name: string;
  email: string;
  pgType: PgType;
};

export type LoginResponse = BaseApiResponse & {
  data: {
    admin: AdminResponse;
    token: string;
    expiresIn: string;
  };
};

// Member related types based on actual API response
export interface RoomInfo {
  id: string;
  roomNo: string;
  rent: number;
  capacity: number;
}

export interface Payment {
  id: string;
  memberId?: string;
  member?: MemberData;
  pgId?: string;
  pg?: Pg;
  month: number;
  year: number;
  rentAmount: number;
  electricityAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatusTypes;
  approvalStatus: ApprovalStatusTypes;
  dueDate: string;
  overdueDate?: string;
  paidDate?: string;
  paymentMethod?: string;
  attemptNumber: number;
  rentBillScreenshot?: string;
  electricityBillScreenshot?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Pg {
  id: string;
  name: string;
  type: PgType;
  location: string;
  rooms?: RoomInfo[];
  members?: MemberData[];
  payment?: Payment[];
}

// PG List Response for dropdowns
export interface PgListOption {
  value: string; // pgId
  label: string; // display label
  pgName: string; // PG name
  pgType: string; // PG type
}

export interface PgListResponse extends BaseApiResponse {
  data?: {
    options: PgListOption[];
  };
}

export interface MemberData {
  id: string;
  memberId: string;
  name: string;
  dob: string;
  gender: "MALE" | "FEMALE";
  location: string;
  email: string;
  phone: string;
  work: string;
  photoUrl: string;
  documentUrl: string;
  digitalSignature?: string | null;
  rentType: RentType;
  rentAmount: number;
  advanceAmount: number;
  pricePerDay?: number | null;
  pgType: PgType;
  pgId: string;
  roomId: string;
  dateOfJoining: string;
  dateOfRelieving?: string | null;
  isActive: boolean;
  isFirstTimeLogin: boolean;
  createdAt: string;
  updatedAt: string;
  pgDetails: {
    id: string;
    name: string;
    type: PgType;
    location: string;
  };
  roomDetails: {
    id: string;
    roomNo: string;
    capacity: number;
  };
  tenure: {
    days: number;
    months: number;
    years: number;
    totalDays: number;
  };
  room?: RoomInfo;
  pg?: Pg;
  payments?: Payment[];
}

export interface PendingRegistrationData {
  [key: string]: unknown;
  id: string;
  name: string;
  memberId: "NA" | string;
  dob: string;
  gender: "MALE" | "FEMALE";
  email: string;
  phone: string;
  location: string;
  work: string;
  pgLocation: string;
  rentType: RentType;
  photoUrl: string;
  documentUrl: string;
  pgType: PgType;
}

export interface PaymentApprovalData extends MemberData {
  [key: string]: unknown;
  rentAmount: number;
  pgLocation: string;
  pgName: string;
  roomNo: string;
  requestedMonthPaymentStatus: PaymentStatusTypes;
  requestedMonthApprovalStatus: ApprovalStatusTypes;
  requestedMonthPayment: {
    id: string;
    paymentStatus: PaymentStatusTypes;
    approvalStatus: ApprovalStatusTypes;
    amount: number;
    month: number;
    year: number;
    dueDate: string;
    overdueDate: string;
    paidDate: string | null;
    rentBillScreenshot: string | null;
    electricityBillScreenshot: string | null;
    attemptNumber: number;
    createdAt: string;
  };
  hasRequestedMonthPayment: boolean;
}

export type ApprovalMembersResponse = PaginatedResponse<PendingRegistrationData>;
export interface PaymentApprovalResponse extends BaseApiResponse {
  data: {
    tableData: PaymentApprovalData[]
    pagination: Pagination
  }
}


// Formatted member data for table display
export interface TableMemberData extends MemberData {
  [key: string]: unknown;
  pgLocation: string;
  pgName: string;
  roomNo: string;
  paymentStatus: PaymentStatusTypes;
  rentAmount: number;
  currentMonthPayment: Payment;
}

// Members API Response
export interface DashboardApiResponse extends BaseApiResponse {
  data: {
    tableData: TableMemberData[],
  },
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type MembersApiResponse = DashboardApiResponse;

// Dashboard Stats card reponse

export type colors = "primary" | "success" | "warning" | "error" | "info";

export interface CardItem {
  title?: string;
  value?: string;
  trend?: "up" | "down";
  percentage?: number;
  icon: IconName;
  color?: colors;
  subtitle?: string;
  badge?: {
    text: string;
    color: colors;
  };
  onClick?: () => void;
}

export interface DashboardStatsResponse extends BaseApiResponse {
  data: {
    cards?: CardItem[];
    lastUpdated: Date;
  };
}

export interface DashboardFiltersResponse extends BaseApiResponse {
  data: {
    filters: types["FilterItemProps"][]
  }
}

export interface ApprovalStats extends BaseApiResponse {
  data: {
    cards : CardItem[],
    lastUpdated: {
      registration: Date,
      payment: Date
    },
    count:{
      registrationPending: number,
      pendingApprovals: number
    }
  }
}

export interface ApprovalFiltersResponse extends BaseApiResponse {
  data: {
    filters: types["FilterItemProps"][];
    totalPGs: number;
  };
}

// QuickView Modal data structure
export interface QuickViewMemberData {
  id: string;
  memberId?: string;
  name: string;
  roomNo: string;
  rentType: RentType;
  profileImage?: string;
  phone?: string;
  email?: string;
  paymentStatus: PaymentStatusTypes
  paymentApprovalStatus?: ApprovalStatusTypes;
  documents?: { name: string; url: string; }[];
  dob?: string;
  work?: string;
  location?: string;
  pgLocation?: string;
  advanceAmount?: number;
  rent?: number;
  joinedOn?: string;
  aadharUrl?: string;
  dateOfRelieving?: string;
}

// Payment QuickView Modal data structure
export interface PaymentQuickViewData {
  id: string;
  memberId: string;
  name: string;
  dob: string;
  gender: "MALE" | "FEMALE";
  location: string;
  email: string;
  phone: string;
  work: string;
  profileImage?: string;
  rentType: "LONG_TERM" | "SHORT_TERM";
  pgLocation: string;
  pgName: string;
  roomNo: string;
  rent: number;
  advanceAmount: number;
  dateOfJoining: string;
  paymentDetails: {
    id: string;
    paymentStatus: PaymentStatusTypes;
    approvalStatus: ApprovalStatusTypes;
    amount: number;
    month: number;
    year: number;
    dueDate: string;
    overdueDate: string;
    paidDate: string | null;
    rentBillScreenshot: string | null;
    electricityBillScreenshot: string | null;
    attemptNumber: number;
    createdAt: string;
  };
  documents?: { name: string; url: string; }[];
}

export interface PaymentHistory extends Payment {
  [key: string]: unknown;
}

export interface MemberProfileData {
  member: MemberData
  paymentHistory: {
    data: PaymentHistory[]
    pagination: Pagination
  },
  paymentSummary: {
    totalAmountPaid: number;
    totalAmountPending: number;
    dueDate: string | null;
  }
}

export interface MemberProfileDataReponse extends BaseApiResponse {
  data: MemberProfileData
}


export interface RoomsFilterResponse extends BaseApiResponse {
  data: {
    filters: types["FilterItemProps"][];
    totalPGs: number;
  };
}

export interface RoomsStatsResponse extends BaseApiResponse {
  data: {
    cards?: CardItem[];
    lastUpdated: Date;
  };
}

export interface RoomData {
  [key: string]: unknown;
  id: string;
  roomNo: string;
  occupied: number;
  status: string;
  statusValue: string;
  capacity: number;
  currentOccupancy: number;
  availableSlots: number;
  isFullyOccupied: boolean;
  members: {
    id: string;
    memberId: string;
    name: string;
    gender: "MALE" | "FEMALE";
    rentType: RentType;
  }[]
}

export interface RoomsApiResponse extends BaseApiResponse {
  data: {
    rooms: RoomData[];
    pgDetails: {
      id: string;
      name: string;
      type: PgType;
      location: string;
    }
    pagination: Pagination
  };
}

export interface EnquiryData {
  [key: string]: unknown;
  id: string;
  name: string;
  phone: string;
  message: string;
  status: "NOT_RESOLVED" | "RESOLVED";
  resolvedBy: string | null;
  resolvedAt: Date | null;
  resolver: {
    id: string;
    name: string;
    email: string;
    pgType: string;
  } | null;
}

export interface EnquiryDataResponse extends BaseApiResponse {
  data: {
    enquiries: EnquiryData[];
    pagination: Pagination;
  };
}

export interface EnquiryStatsResponse extends BaseApiResponse {
  data: {
    cards?: CardItem[];
    lastUpdated: Date;
  };
}

export interface EnquiryFiltersResponse extends BaseApiResponse {
  data: {
    filters: types["FilterItemProps"][];
  };
}

// Reports apiResponse

export interface ReportsPageCardsResponse extends BaseApiResponse {
  data: {
    cards: CardItem[];
    weekRange: {
      start: Date;
      end: Date;
    };
    lastUpdated: Date;
  };
}

// PG Report Data
export interface PgReportData {
  [key: string]: unknown;
  pgId: string;
  pgName: string;
  pgLocation: string;
  pgType: PgType;
  totalMembers: number;
  newMembersThisWeek: number;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  occupancyRate: number;
  weeklyRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  totalExpenses: number;
  totalElectricityCharges: number;
  pendingLeavingRequests: number;
  approvedLeavingRequests: number;
  netRevenue: number;
  avgRentPerRoom: number;
}

export interface PgReportResponse extends BaseApiResponse {
  data: {
    tableData: PgReportData[];
    pagination: Pagination;
  };
}

// Room Report Data
export interface RoomReportData {
  [key: string]: unknown;
  pgName: string;
  pgLocation: string;
  roomNo: string;
  roomId: string;
  capacity: number;
  currentOccupants: number;
  utilizationRate: number;
  rentAmount: number;
  electricityCharge: number;
  weeklyRevenue: number;
  availableSlots: number;
  totalMonthlyEarnings: number;
  revenuePerOccupant: number;
  electricityPerOccupant: number;
  revenueEfficiency: number;
}

export interface RoomReportResponse extends BaseApiResponse {
  data: {
    tableData: RoomReportData[];
    pagination: Pagination;
  };
}

// Payment Report Data
export interface PaymentReportData {
  [key: string]: unknown;
  pgName: string;
  pgLocation: string;
  totalMembers: number;
  paymentsReceived: number;
  paymentsApproved: number;
  paymentsPending: number;
  paymentsOverdue: number;
  totalAmountReceived: number;
  totalAmountApproved: number;
  totalAmountPending: number;
  totalAmountOverdue: number;
  avgPaymentAmount: number;
  totalExpectedRevenue: number;
  shortfallAmount: number;
  collectionEfficiency: number;
}

export interface PaymentReportResponse extends BaseApiResponse {
  data: {
    tableData: PaymentReportData[];
    pagination: Pagination;
  };
}

// Financial Report Data (you can add this structure later when available)
export interface FinancialReportData {
  [key: string]: unknown;
  // Add fields as needed when API structure is available
}

export interface FinancialReportResponse extends BaseApiResponse {
  data: {
    tableData: FinancialReportData[];
    pagination: Pagination;
  };
}

// Expense Management types
export interface ExpenseStatsResponse extends BaseApiResponse {
  data: {
    cards?: CardItem[];
    lastUpdated: Date | string;
  };
}

export interface ExpenseFiltersResponse extends BaseApiResponse {
  data: {
    filters: types["FilterItemProps"][];
  };
}

// Expense Table Data Types
export interface ExpenseEntry {
  id: string;
  entryType: 'CASH_IN' | 'CASH_OUT';
  amount: number;
  date: string;
  partyName: string;
  remarks?: string;
  paymentType: 'CASH' | 'ONLINE';
  attachedBill1: string | null;
  attachedBill2: string | null;
  attachedBill3: string | null;
  pgId: string;
  pgName: string;
  pgLocation: string;
  pgType: PgType;
  createdAt: string;
  createdBy: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  updatedAt: string;
}

export interface ExpenseTableResponse extends PaginatedResponse<ExpenseEntry> {
  data : ExpenseEntry[]
}

// Relieving Requests interfaces
export interface RelievingRequestData {
  id: string;
  memberId: string;
  pgId: string;
  roomId: string;
  requestedLeaveDate: string;
  reason: string;
  feedback?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  approvedBy: string | null;
  approvedAt: string | null;
  pendingDues: number;
  finalAmount: number;
  settledDate: string | null;
  settlementProof: string | null;
  paymentMethod: 'CASH' | 'ONLINE' | null;
  createdAt: string;
  updatedAt: string;
  // Flattened member fields
  memberName: string;
  memberMemberId: string;
  memberPhone: string;
  memberEmail: string;
  memberAge: number;
  // Flattened PG fields
  pgName: string;
  pgType: PgType;
  pgLocation: string;
  // Flattened room fields
  roomNo: string | null;
  roomRent: number | null;
}

export interface RelievingRequestsResponse extends PaginatedResponse<RelievingRequestData> {
  data: RelievingRequestData[];
}

// Week Options API Response
export interface WeekOption {
  week: number;
  month: number;
  year: number;
  startDate: string;
  endDate: string;
  label: string;
}

export interface MonthInfo {
  month: number;
  year: number;
  name: string;
  label: string;
}

export interface WeekOptionsResponse extends BaseApiResponse {
  data: {
    weeks: WeekOption[];
    currentWeek: WeekOption;
    monthInfo: MonthInfo;
  };
}

// Month Options API Response
export interface MonthOption {
  value: string;
  label: string;
}

export interface YearInfo {
  year: number;
  isCurrent: boolean;
  isPast: boolean;
  hasData: boolean;
}

export interface MonthOptionsResponse extends BaseApiResponse {
  data: {
    year: number;
    months: MonthOption[];
    maxMonth: number;
  };
}