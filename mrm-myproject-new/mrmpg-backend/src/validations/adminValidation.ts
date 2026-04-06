import Joi from "joi";
import { Gender, RentType, PgType } from "@prisma/client";

// Admin validation schemas
export const adminLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required().min(6),
});

export const createAdminSchema = Joi.object({
  name: Joi.string().required().min(2).max(100).trim(),
  email: Joi.string().email().required(),
  password: Joi.string().required().min(6).max(100),
  pgType: Joi.string().valid('MENS', 'WOMENS').required(),
});

export const updateAdminSchema = Joi.object({
  name: Joi.string().optional().min(2).max(100).trim(),
  email: Joi.string().email().optional(),
  password: Joi.string().optional().min(6).max(100),
  pgType: Joi.string().valid('MENS', 'WOMENS').optional(),
}).min(1); // At least one field must be provided

// Admin add member validation schema
export const adminAddMemberSchema = Joi.object({
  name: Joi.string().required().min(2).max(100).trim(),
  dob: Joi.date().iso().required().max('now').min('1900-01-01'),
  location: Joi.string().required().min(2).max(200).trim(),
  email: Joi.string().email().required(),
  phone: Joi.string().required().pattern(/^[0-9]{10}$/),
  work: Joi.string().required().min(1).max(100).trim(),
  // Note: photoUrl and documentUrl come from file uploads, not body
  rentType: Joi.string().valid(...Object.values(RentType)).required(),
  rentAmount: Joi.number().min(0).required(),
  advanceAmount: Joi.number().min(0).required(),
  pricePerDay: Joi.number().positive().when('rentType', {
    is: 'SHORT_TERM',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  pgId: Joi.string().required(),
  roomId: Joi.string().optional(),
  dateOfJoining: Joi.date().iso().optional(),
  dateOfRelieving: Joi.date().iso().when('rentType', {
    is: 'SHORT_TERM',
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
});

// Common validation schemas
export const idParamSchema = Joi.object({
  id: Joi.string().required(),
});

export const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// Registered members query validation schema
export const registeredMembersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional().trim(),
  gender: Joi.string().valid('MALE', 'FEMALE').optional(),
  rentType: Joi.string().valid('LONG_TERM', 'SHORT_TERM').optional(),
});

// Member approval validation schema
export const approveRejectMemberSchema = Joi.object({
  status: Joi.string().valid('APPROVED', 'REJECTED').required(),
  pgId: Joi.when('status', {
    is: 'APPROVED',
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
  roomId: Joi.string().optional(),
  advanceAmount: Joi.number().min(0).optional(),
  dateOfJoining: Joi.date().iso().optional(),
  pgLocation: Joi.string().optional(),
  dateOfRelieving: Joi.date().iso().optional(),
  pricePerDay: Joi.number().positive().optional(),
  rentAmount: Joi.number().min(0).optional(),
});

// Members payment data query validation schema
export const membersPaymentDataQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional().trim(),
  rentType: Joi.string().valid('LONG_TERM', 'SHORT_TERM').optional(),
  pgLocation: Joi.string().optional().trim(), // Can be comma-separated values
  paymentStatus: Joi.string().valid('PAID', 'PENDING', 'OVERDUE').optional(),
  approvalStatus: Joi.string().valid('APPROVED', 'PENDING', 'REJECTED').optional(),
  month: Joi.number().integer().min(1).max(12).optional(),
  year: Joi.number().integer().min(2000).optional(),
});

// Mark payment as paid validation schema
export const markPaymentAsPaidSchema = Joi.object({
  paymentMethod: Joi.string().valid('CASH', 'ONLINE').required(),
  paidDate: Joi.date().iso().optional().max('now'),
  notes: Joi.string().optional().max(500).trim(),
});
