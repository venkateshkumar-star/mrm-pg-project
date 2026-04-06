import Joi from "joi";

// Room creation validation schema
export const createRoomSchema = Joi.object({
  roomNo: Joi.string().required().min(1).max(10).trim(),
  capacity: Joi.number().integer().required().min(1).max(20),
  pgLocation: Joi.string().optional()
});

// Room update validation schema
export const updateRoomSchema = Joi.object({
  roomNo: Joi.string().optional().min(1).max(10).trim(),
  capacity: Joi.number().integer().optional().min(1).max(20),
}).min(1);

// Electricity charge validation schema
export const addElectricityChargeSchema = Joi.object({
  amount: Joi.number().required().min(0).max(999999),
  month: Joi.number().integer().required().min(1).max(12),
  year: Joi.number().integer().required().min(2020).max(2050),
  billDate: Joi.date().required().iso(),
  unitsUsed: Joi.number().integer().required().min(0).max(99999),
  description: Joi.string().optional().allow('').max(500).trim(),
  roomId: Joi.string().required().trim(),
});

// Electricity charges query validation schema
export const electricityChargesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  month: Joi.number().integer().min(1).max(12).optional(),
  year: Joi.number().integer().min(2020).max(2050).optional(),
});

// Common validation schemas
export const idParamSchema = Joi.object({
  id: Joi.string().required(),
});

export const pgIdParamSchema = Joi.object({
  pgId: Joi.string().required(),
});

export const roomIdParamSchema = Joi.object({
  roomId: Joi.string().required(),
});

export const pgIdAndRoomIdParamSchema = Joi.object({
  pgId: Joi.string().required(),
  roomId: Joi.string().required(),
});

export const locationParamSchema = Joi.object({
  location: Joi.string().required().min(1).trim(),
});

export const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// Room filtering and pagination query schema
export const roomFilterQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  occupancyStatus: Joi.string().valid('FULLY_VACANT', 'PARTIALLY_OCCUPIED', 'FULLY_OCCUPIED').optional(),
  search: Joi.string().optional().max(50).trim(),
}).custom((value, helpers) => {
  // Validate rent range
  if (value.minRent && value.maxRent && value.minRent > value.maxRent) {
    return helpers.error('custom.rentRange');
  }
  
  // Validate capacity range
  if (value.minCapacity && value.maxCapacity && value.minCapacity > value.maxCapacity) {
    return helpers.error('custom.capacityRange');
  }
  
  return value;
}).messages({
  'custom.rentRange': 'minRent cannot be greater than maxRent',
  'custom.capacityRange': 'minCapacity cannot be greater than maxCapacity',
});


export const roomFilterParamsSchema = Joi.object({
  location: Joi.string().optional(),
  occupancyStatus: Joi.string().valid('FULLY_VACANT', 'PARTIALLY_OCCUPIED', 'FULLY_OCCUPIED').optional(),
});

// PG electricity charges query validation schema
export const pgElectricityChargesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  month: Joi.number().integer().min(1).max(12).optional(),
  year: Joi.number().integer().min(2020).max(2050).optional(),
});