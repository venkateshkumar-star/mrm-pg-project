import multer, { StorageEngine, FileFilterCallback } from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);

// Ensure temp directory exists
export const ensureTempDirectory = async (): Promise<void> => {
  const tempDir = path.join('uploads', 'temp');
  try {
    await fs.promises.access(tempDir);
  } catch {
    await fs.promises.mkdir(tempDir, { recursive: true });
  }
};

// Image upload types
export enum ImageType {
  PROFILE = 'profile',
  DOCUMENT = 'profile', // Documents now go to profile folder
  PAYMENT = 'payments'  // Renamed from 'payment' to 'payments'
}

// Interface for image upload result
export interface ImageUploadResult {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
}

// Base uploads directory
const UPLOADS_BASE_DIR = path.join(process.cwd(), 'uploads');

// Create folder structure for a specific user
export const createUserUploadFolders = async (userUuid: string): Promise<void> => {
  try {
    const userBaseDir = path.join(UPLOADS_BASE_DIR, userUuid);
    const folders = [
      path.join(userBaseDir, 'profile'),
      path.join(userBaseDir, 'payments')
    ];

    for (const folder of folders) {
      if (!fs.existsSync(folder)) {
        await mkdirAsync(folder, { recursive: true });
      }
    }
  } catch (error) {
    console.error('Error creating user upload folders:', error);
    throw new Error('Failed to create user upload directories');
  }
};

// Create base uploads directory
const createBaseUploadFolder = async (): Promise<void> => {
  try {
    if (!fs.existsSync(UPLOADS_BASE_DIR)) {
      await mkdirAsync(UPLOADS_BASE_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating base upload folder:', error);
    throw new Error('Failed to create base upload directory');
  }
};

// Initialize base folder on module load
createBaseUploadFolder();

// File filter function to validate image types
export const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  // Check if file is an image
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'));
  }

  // Allowed image types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }

  cb(null, true);
};

// Generate unique filename
const generateFilename = (originalname: string): string => {
  const timestamp = Date.now();
  const randomNum = Math.round(Math.random() * 1E9);
  const extension = path.extname(originalname);
  return `${timestamp}-${randomNum}${extension}`;
};

// Storage configuration for different image types with user UUID
const createStorage = (imageType: ImageType): StorageEngine => {
  return multer.diskStorage({
    destination: async (req: Request, file: Express.Multer.File, cb) => {
      try {
        // Extract user UUID from request - could be from member or admin
        let userUuid: string | undefined;
        
        // Try to get UUID from authenticated member or admin
        if ((req as any).member?.id) {
          userUuid = (req as any).member.id;
        } else if ((req as any).admin?.id) {
          userUuid = (req as any).admin.id;
        } else if (req.body.memberId) {
          // For admin operations, memberId might be in body
          userUuid = req.body.memberId;
        } else if (req.params.memberId) {
          // For admin operations, memberId might be in params
          userUuid = req.params.memberId;
        }

        if (!userUuid) {
          return cb(new Error('User UUID not found in request'), '');
        }

        // Create user-specific folders if they don't exist
        await createUserUploadFolders(userUuid);
        
        const uploadPath = path.join(UPLOADS_BASE_DIR, userUuid, imageType);
        cb(null, uploadPath);
      } catch (error) {
        cb(error as Error, '');
      }
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
      const filename = generateFilename(file.originalname);
      cb(null, filename);
    }
  }); 
};

// Multer configurations for different image types
export const profileImageUpload = multer({
  storage: createStorage(ImageType.PROFILE),
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  }
});

export const documentImageUpload = multer({
  storage: createStorage(ImageType.DOCUMENT),
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for document images
    files: 1 // Single document image
  }
});

export const paymentImageUpload = multer({
  storage: createStorage(ImageType.PAYMENT),
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  }
});

// Utility functions for image management

// Get image URL from filename, type, and user UUID
export const getImageUrl = (filename: string, imageType: ImageType, userUuid: string): string => {
  return `/uploads/${userUuid}/${imageType}/${filename}`;
};

// Get full image path from filename, type, and user UUID
export const getImagePath = (filename: string, imageType: ImageType, userUuid: string): string => {
  return path.join(UPLOADS_BASE_DIR, userUuid, imageType, filename);
};

// Delete image file
export const deleteImage = async (filename: string, imageType: ImageType, userUuid?: string): Promise<boolean> => {
  try {
    if (!filename) {
      return false;
    }

    // If userUuid is not provided, try to extract from filename or use fallback logic
    if (!userUuid) {
      console.warn('User UUID not provided for image deletion, attempting fallback');
      // Try old structure first for backward compatibility
      const oldFilePath = path.join(UPLOADS_BASE_DIR, imageType === ImageType.DOCUMENT ? 'document' : imageType, filename);
      if (fs.existsSync(oldFilePath)) {
        await unlinkAsync(oldFilePath);
        return true;
      }
      return false;
    }

    const filePath = getImagePath(filename, imageType, userUuid);
    
    if (fs.existsSync(filePath)) {
      await unlinkAsync(filePath);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

// Delete multiple images
export const deleteImages = async (filenames: string[], imageType: ImageType, userUuid?: string): Promise<number> => {
  let deletedCount = 0;
  
  for (const filename of filenames) {
    const deleted = await deleteImage(filename, imageType, userUuid);
    if (deleted) {
      deletedCount++;
    }
  }
  
  return deletedCount;
};

// Update image (delete old, return new path info)
export const updateImage = async (
  oldFilename: string | null,
  newFile: Express.Multer.File,
  imageType: ImageType,
  userUuid: string
): Promise<ImageUploadResult> => {
  // Delete old image if exists
  if (oldFilename && userUuid) {
    await deleteImage(oldFilename, imageType, userUuid);
  }

  // Return new image info
  return {
    filename: newFile.filename,
    originalname: newFile.originalname,
    mimetype: newFile.mimetype,
    size: newFile.size,
    path: newFile.path,
    url: getImageUrl(newFile.filename, imageType, userUuid)
  };
};

// Check if image exists
export const imageExists = (filename: string, imageType: ImageType, userUuid: string): boolean => {
  if (!filename || !userUuid) {
    return false;
  }
  
  const filePath = getImagePath(filename, imageType, userUuid);
  return fs.existsSync(filePath);
};

// Get image stats
export const getImageStats = (filename: string, imageType: ImageType, userUuid: string): fs.Stats | null => {
  try {
    if (!imageExists(filename, imageType, userUuid)) {
      return null;
    }
    
    const filePath = getImagePath(filename, imageType, userUuid);
    return fs.statSync(filePath);
  } catch (error) {
    console.error('Error getting image stats:', error);
    return null;
  }
};

// Validate image file before upload
export const validateImageFile = (file: Express.Multer.File): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!file.mimetype.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' };
  }

  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }

  return { valid: true };
};

// Create image upload result from multer file
export const createImageUploadResult = (file: Express.Multer.File, imageType: ImageType, userUuid: string): ImageUploadResult => {
  return {
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    url: getImageUrl(file.filename, imageType, userUuid)
  };
};

// Utility function to delete all images for a user
export const deleteUserImages = async (userUuid: string): Promise<number> => {
  try {
    let deletedCount = 0;
    const userDir = path.join(UPLOADS_BASE_DIR, userUuid);
    
    if (fs.existsSync(userDir)) {
      const folders = ['profile', 'payments'];
      
      for (const folder of folders) {
        const folderPath = path.join(userDir, folder);
        if (fs.existsSync(folderPath)) {
          const files = fs.readdirSync(folderPath);
          for (const file of files) {
            const filePath = path.join(folderPath, file);
            await unlinkAsync(filePath);
            deletedCount++;
          }
          // Remove empty folder
          fs.rmdirSync(folderPath);
        }
      }
      
      // Remove user directory if empty
      if (fs.readdirSync(userDir).length === 0) {
        fs.rmdirSync(userDir);
      }
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error deleting user images:', error);
    return 0;
  }
};
