import { Router } from "express";
import multer from "multer";
import {
  validatePersonalData,
  completeRegistration,
} from "../controllers/registrationController";
import { validateBody, validateParams, validateQuery } from "../middlewares/validation";
import {
  validatePersonalDataSchema,
} from "../validations/userValidation";
import { fileFilter, ensureTempDirectory } from "../utils/imageUpload";

const router = Router();

const registrationUpload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        // For registration, we don't have member ID yet, so use a temp directory
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
    files: 2 // Profile + Aadhar
  }
});

router.post("/validate", 
  validateBody(validatePersonalDataSchema), 
  validatePersonalData
);
  
router.post("/",
  registrationUpload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'documentImage', maxCount: 1 }
  ]),
  completeRegistration
);



export default router;
