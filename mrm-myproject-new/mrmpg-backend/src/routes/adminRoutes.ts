import { Router } from "express";
import multer from "multer";
import {
  loginAdmin,
  createAdmin,
  getProfile,
  updateProfile,
  getManagedPGs,
  updateOverduePaymentsEndpoint,
  cleanupInactiveMembers,
  updateLeavingRequestDues,
  addMember,
  markPaymentAsPaid,
} from "../controllers/adminController";
import { validateBody } from "../middlewares/validation";
import { authenticateAdmin, authorizeAdmin } from "../middlewares/auth";
import {
  adminLoginSchema,
  createAdminSchema,
  updateAdminSchema,
  adminAddMemberSchema,
  markPaymentAsPaidSchema,
} from "../validations/adminValidation";
import { fileFilter, ensureTempDirectory } from "../utils/imageUpload";

const router = Router();

// Multer configuration for admin member creation with image uploads
const adminMemberUpload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        // For admin member creation, we don't have member ID yet, so use a temp directory
        // Images will be moved to proper location after member creation
        await ensureTempDirectory();
        cb(null, 'uploads/temp');
      } catch (error) {
        cb(error as Error, '');
      }
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const randomNum = Math.round(Math.random() * 1E9);
      const extension = file.originalname.split('.').pop();
      cb(null, `${timestamp}-${randomNum}.${extension}`);
    }
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 2 // Profile + Document
  }
});

// Multer configuration for payment proof uploads (requires payment ID to get member ID)
const paymentProofUpload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        // For payment uploads, we need to get member ID from payment record
        // Use temp directory first, then move after getting member ID
        await ensureTempDirectory();
        cb(null, 'uploads/temp');
      } catch (error) {
        cb(error as Error, '');
      }
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const randomNum = Math.round(Math.random() * 1E9);
      const extension = file.originalname.split('.').pop();
      cb(null, `payment-${timestamp}-${randomNum}.${extension}`);
    }
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 2 // Rent bill + Electricity bill proof
  }
});

// Public routes
router.post("/login", validateBody(adminLoginSchema), loginAdmin);

// Temporary route for creating admin, remove later
router.post("/", validateBody(createAdminSchema), createAdmin);

// Protected routes (authentication required)
router.use(authenticateAdmin);
router.use(authorizeAdmin);

// Admin management routes
router.get("/profile", getProfile);
router.put("/profile", validateBody(updateAdminSchema), updateProfile);

// PG management routes
router.get("/pgs", getManagedPGs);

// Member management routes
router.post("/members", 
  adminMemberUpload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'documentImage', maxCount: 1 }
  ]),
  validateBody(adminAddMemberSchema), 
  addMember
);

// Payment record management routes
router.post("/payment-records/update-overdue", updateOverduePaymentsEndpoint);

// Mark payment as paid and approved - supports both CASH and ONLINE payment methods
// For ONLINE payments, optionally accepts payment proof images (rentBillScreenshot, electricityBillScreenshot)
router.put("/payments/:paymentId/mark-paid", 
  paymentProofUpload.fields([
    { name: 'rentBillScreenshot', maxCount: 1 },
    { name: 'electricityBillScreenshot', maxCount: 1 }
  ]),
  validateBody(markPaymentAsPaidSchema), 
  markPaymentAsPaid
);

// WARNING: This action is irreversible
router.delete("/members/inactive", cleanupInactiveMembers);

// Leaving request management routes
router.post("/leaving-requests/update-dues", updateLeavingRequestDues);

export default router;
