import { PgType, Gender, RentType } from "@prisma/client";

// Admin related types
export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface CreateAdminRequest {
  name: string;
  email: string;
  password: string;
  pgType: PgType;
}

export interface UpdateAdminRequest {
  name?: string;
  email?: string;
  password?: string;
  pgType?: PgType;
}

// PG related types
export interface CreatePGRequest {
  name: string;
  type: PgType;
  location: string;
}

export interface UpdatePGRequest {
  name?: string;
  type?: PgType;
  location?: string;
}

// Room related types
export interface CreateRoomRequest {
  roomNo: string;
  capacity: number;
}

export interface UpdateRoomRequest {
  roomNo?: string;
  capacity?: number;
}

// Electricity Charge related types
export interface CreateElectricityChargeRequest {
  roomId: string;
  amount: number;
  month: number; // 1-12
  year: number;
  billDate: string; // ISO date string
  unitsUsed: number;
  description?: string;
}

export interface UpdateElectricityChargeRequest {
  amount?: number;
  billDate?: string; // ISO date string
  unitsUsed?: number;
  description?: string;
}

// Member related types
export interface CreateMemberRequest {
  name: string;
  dob: string; // Date of birth as ISO string
  gender: Gender;
  location: string;
  pgLocation: string;
  email: string;
  phone: string;
  work: string;
  photoUrl?: string;
  aadharUrl?: string;
  rentType: RentType;
  dateOfRelieving?: string;
  pgType: PgType;
}

export interface PersonalDataValidation {
  name: string;
  dob: string; // Date of birth as ISO string
  gender: Gender;
  phone: string;
  email: string;
  location: string;
}

// Member filter types
export interface GetMembersFilterRequest {
  page?: number;
  limit?: number;
  search?: string; // Search by name, email, phone, or memberId
  gender?: Gender;
  rentType?: RentType;
  roomNo?: string;
  dobFrom?: string; // Date of birth from (ISO date string)
  dobTo?: string; // Date of birth to (ISO date string)
  advanceAmountMin?: number;
  advanceAmountMax?: number;
  dateJoinedFrom?: string; // ISO date string
  dateJoinedTo?: string; // ISO date string
}

// Admin add member types
export interface AdminAddMemberRequest {
  name: string;
  dob: string; // Date of birth as ISO string
  location: string;
  email: string;
  phone: string;
  work: string;
  // Note: photoUrl and documentUrl are generated from file uploads, not provided in body
  rentType: RentType;
  rentAmount: number;
  advanceAmount: number;
  pricePerDay?: number; // For short-term members
  pgId: string;
  roomId?: string;
  dateOfJoining?: string; // ISO date string, defaults to now
  dateOfRelieving?: string; // ISO date string for short-term members
}

// Member approval types
export interface ApproveRejectMemberRequest {
  status: 'APPROVED' | 'REJECTED';
  pgId: string;
  roomId: string;
  rentAmount: number;
  advanceAmount: number;
  dateOfJoining?: string; // ISO date string
  pricePerDay?: number; // For short-term members
  dateOfRelieving?: string; // ISO date string for short-term members
}

// Member deletion types
export interface DeleteMultipleMembersRequest {
  memberIds: string[];
}

// Payment approval types
export interface ApproveRejectPaymentRequest {
  approvalStatus: 'APPROVED' | 'REJECTED';
}

// Payment related types
export interface SubmitPaymentRequest {
  name: string;
  memberId: string;
  roomId: string;
  pgId: string;
}

// Enquiry related types
export interface CreateEnquiryRequest {
  name: string;
  phone: string;
  message: string;
}

export interface UpdateEnquiryStatusRequest {
  status: "NOT_RESOLVED" | "RESOLVED";
}

// Payment Management Request
export interface MarkPaymentAsPaidRequest {
  paymentMethod: "CASH" | "ONLINE";
  paidDate?: string; // Optional, defaults to current date
}