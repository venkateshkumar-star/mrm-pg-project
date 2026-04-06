import { Router } from "express";
import { authenticateAdmin, authorizeAdmin } from "../middlewares/auth";
import {
  getDashboardFilterOptions,
  getEnquiryFilterOptions,
  getMemberFilterOptions,
  getMembersPaymentFilterOptions,
  getMonthOptionsForYear,
  getPgLocationOptions,
  getAdminPgLocationOptions,
  getRoomFilterOptions,
  getRoomsByLocation,
  getRoomsByPgId,
  getAvailableWeeks,
  getEbChargesFilterOptions
} from "../controllers/filtersController";
import { validateParams } from "../middlewares/validation";
import { locationParamSchema } from "../validations/roomValidation";

const router = Router();

//Public route
router.get("/pg-locations", getPgLocationOptions);

router.use(authenticateAdmin);
router.use(authorizeAdmin);

// Admin-specific PG locations based on token
router.get("/admin-pg-locations", getAdminPgLocationOptions);

router.get("/dashboard", getDashboardFilterOptions);

router.get("/members", getMemberFilterOptions);

router.get("/payments", getMembersPaymentFilterOptions);
router.get("/payments/months", getMonthOptionsForYear);

// Rooms Filters
router.get("/rooms", getRoomFilterOptions);
// GET /rooms/location/:location - Get rooms by location
router.get(
  "/rooms/location/:location",
  validateParams(locationParamSchema),
  getRoomsByLocation
);
router.get("/pg/rooms", getRoomsByPgId);

// Electricity Charges Filters
router.get("/eb-charges", getEbChargesFilterOptions);

router.get("/enquiry", getEnquiryFilterOptions);

router.get("/reports/weeks", getAvailableWeeks);
router.get("/reports/months", getMonthOptionsForYear);

export default router;
