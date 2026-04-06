import { Request, Response } from "express";
import prisma from "../config/prisma";
import { AdminLoginRequest, CreateAdminRequest, UpdateAdminRequest, AdminAddMemberRequest, MarkPaymentAsPaidRequest } from "../types/request";
import { ApiResponse, AdminResponse, AdminLoginResponse } from "../types/response";
import { hashPassword, comparePassword, generateAdminToken } from "../utils/auth";
import { AuthenticatedRequest } from "../middlewares/auth";
import { ENV } from "../config/env";
import { 
  updateOverduePayments,
} from "../utils/paymentRecordManager";
import { cleanupInactiveMemberData } from "../utils/memberCleanup";
import { updateLeavingRequestPendingDues } from "../utils/leavingRequestDuesCalculator";
import { generateUniqueMemberId } from "../utils/memberIdGenerator";
import { Gender } from "@prisma/client";
import { sendApprovalNotification, getApprovalSuccessMessage } from "../utils/memberNotificationHelper";
import { getImageUrl, ImageType, deleteUserImages, createUserUploadFolders, ensureTempDirectory } from "../utils/imageUpload";
import path from 'path';
import fs from 'fs/promises';

// Helper function to move payment files from temp directory to user directory
const movePaymentFiles = async (userUuid: string, tempFiles: { rentBill?: string; electricityBill?: string }) => {
  const movedFiles: { rentBillUrl?: string; electricityBillUrl?: string } = {};
  
  try {
    // Create user upload folders if they don't exist
    await createUserUploadFolders(userUuid);
    
    // Move rent bill screenshot if exists
    if (tempFiles.rentBill) {
      const tempPath = path.join('uploads', 'temp', tempFiles.rentBill);
      const fileName = path.basename(tempFiles.rentBill);
      const newPath = path.join('uploads', userUuid, 'payments', fileName);
      
      // Check if temp file exists before moving
      if (await fs.access(tempPath).then(() => true).catch(() => false)) {
        await fs.rename(tempPath, newPath);
        movedFiles.rentBillUrl = getImageUrl(fileName, ImageType.PAYMENT, userUuid);
      }
    }
    
    // Move electricity bill screenshot if exists
    if (tempFiles.electricityBill) {
      const tempPath = path.join('uploads', 'temp', tempFiles.electricityBill);
      const fileName = path.basename(tempFiles.electricityBill);
      const newPath = path.join('uploads', userUuid, 'payments', fileName);
      
      // Check if temp file exists before moving
      if (await fs.access(tempPath).then(() => true).catch(() => false)) {
        await fs.rename(tempPath, newPath);
        movedFiles.electricityBillUrl = getImageUrl(fileName, ImageType.PAYMENT, userUuid);
      }
    }
    
    return movedFiles;
  } catch (error) {
    console.error('Error moving payment files:', error);
    throw error;
  }
};

// Helper function to move uploaded files from temp directory to user directory
const moveUploadedFiles = async (userUuid: string, tempFiles: { profile?: string; document?: string }) => {
  const movedFiles: { profileImage?: string; documentImage?: string } = {};
  
  try {
    // Create user upload folders if they don't exist
    await createUserUploadFolders(userUuid);
    
    // Move profile image if exists
    if (tempFiles.profile) {
      const tempPath = path.join('uploads', 'temp', tempFiles.profile);
      const fileName = path.basename(tempFiles.profile);
      const newPath = path.join('uploads', userUuid, 'profile', fileName);
      
      // Check if temp file exists before moving
      if (await fs.access(tempPath).then(() => true).catch(() => false)) {
        await fs.rename(tempPath, newPath);
        movedFiles.profileImage = getImageUrl(fileName, ImageType.DOCUMENT, userUuid);
      }
    }
    
    // Move document image if exists
    if (tempFiles.document) {
      const tempPath = path.join('uploads', 'temp', tempFiles.document);
      const fileName = path.basename(tempFiles.document);
      const newPath = path.join('uploads', userUuid, 'profile', fileName);
      
      // Check if temp file exists before moving
      if (await fs.access(tempPath).then(() => true).catch(() => false)) {
        await fs.rename(tempPath, newPath);
        movedFiles.documentImage = getImageUrl(fileName, ImageType.DOCUMENT, userUuid);
      }
    }
    
    return movedFiles;
  } catch (error) {
    console.error('Error moving uploaded files:', error);
    throw error;
  }
};

// Admin login
export const loginAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: AdminLoginRequest = req.body;

    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      res.status(401).json({
        success: false,
        message: "Authentication failed",
        error: "Invalid email or password",
      } as ApiResponse<null>);
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, admin.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Authentication failed",
        error: "Invalid email or password",
      } as ApiResponse<null>);
      return;
    }

    // Generate JWT token
    const token = generateAdminToken({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        pgType: admin.pgType,
    });

    // Remove password from response
    const { password: _, ...adminResponse } = admin;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        admin: adminResponse,
        token,
        expiresIn: ENV.JWT_EXPIRES_IN,
      },
    } as ApiResponse<AdminLoginResponse>);
  } catch (error) {
    console.error("Error during admin login:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to login",
    } as ApiResponse<null>);
  }
};

// Create a new admin
export const createAdmin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, pgType }: CreateAdminRequest = req.body;

    // Check if admin with email already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      res.status(409).json({
        success: false,
        message: "Admin with this email already exists",
      } as ApiResponse<null>);
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new admin
    const newAdmin = await prisma.admin.create({
      data: {
        name,
        email,
        password: hashedPassword,
        pgType,
      },
    });

    // Remove password from response
    const { password: _, ...adminResponse } = newAdmin;

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: adminResponse,
    } as ApiResponse<AdminResponse>);
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to create admin",
    } as ApiResponse<null>);
  }
};

// Get current admin profile
export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      } as ApiResponse<null>);
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
      select: {
        id: true,
        name: true,
        email: true,
        pgType: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      res.status(404).json({
        success: false,
        message: "Admin not found",
      } as ApiResponse<null>);
      return;
    }

    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: admin,
    } as ApiResponse<AdminResponse>);
  } catch (error) {
    console.error("Error getting admin profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve profile",
    } as ApiResponse<null>);
  }
};

// Update admin profile
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      } as ApiResponse<null>);
      return;
    }

    const { name, email, password, pgType }: UpdateAdminRequest = req.body;

    // Check if email is being updated and if it already exists
    if (email && email !== req.admin.email) {
      const existingAdmin = await prisma.admin.findUnique({
        where: { email },
      });

      if (existingAdmin) {
        res.status(409).json({
          success: false,
          message: "Email already exists",
        } as ApiResponse<null>);
        return;
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (pgType) updateData.pgType = pgType;
    if (password) updateData.password = await hashPassword(password);

    // Update admin
    const updatedAdmin = await prisma.admin.update({
      where: { id: req.admin.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        pgType: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedAdmin,
    } as ApiResponse<AdminResponse>);
  } catch (error) {
    console.error("Error updating admin profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to update profile",
    } as ApiResponse<null>);
  }
};

// Get PGs managed by admin
export const getManagedPGs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      } as ApiResponse<null>);
      return;
    }

    // Get admin details to know their pgType
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
      select: { pgType: true },
    });

    if (!admin) {
      res.status(404).json({
        success: false,
        message: "Admin not found",
      } as ApiResponse<null>);
      return;
    }

    // Get PGs of the same type as admin's pgType
    const pgs = await prisma.pG.findMany({
      where: {
        type: admin.pgType,
      },
      include: {
        _count: {
          select: {
            rooms: true,
            members: true,
            payments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      message: "Managed PGs retrieved successfully",
      data: pgs,
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting managed PGs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve managed PGs",
    } as ApiResponse<null>);
  }
};

// Update overdue payment statuses
export const updateOverduePaymentsEndpoint = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      } as ApiResponse<null>);
      return;
    }

    const result = await updateOverduePayments();

    res.status(200).json({
      success: true,
      message: "Overdue payments updated successfully",
      data: result,
    } as ApiResponse<any>);

  } catch (error) {
    console.error("Error updating overdue payments:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error", 
      error: "Failed to update overdue payments",
    } as ApiResponse<null>);
  }
};

// Manual cleanup of inactive member data - permanently removes all inactive members and their associated data
export const cleanupInactiveMembers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "Admin authentication required",
      } as ApiResponse<null>);
      return;
    }

    const result = await cleanupInactiveMemberData();

    if (result.deletedMembers === 0) {
      res.status(200).json({
        success: true,
        message: "No inactive members found for cleanup",
        data: {
          deletedMembers: 0,
          deletedFiles: 0,
          deletedPaymentRecords: 0,
          deletedLeavingRequests: 0,
          memberDetails: []
        },
      } as ApiResponse<any>);
      return;
    }

    res.status(200).json({
      success: true,
      message: `Successfully cleaned up ${result.deletedMembers} inactive member(s)`,
      data: {
        summary: {
          totalMembersDeleted: result.deletedMembers,
          totalFilesDeleted: result.deletedFiles,
          totalPaymentRecordsDeleted: result.deletedPaymentRecords,
          totalLeavingRequestsDeleted: result.deletedLeavingRequests,
        },
        deletedMembers: result.memberDetails,
      },
    } as ApiResponse<any>);

  } catch (error) {
    console.error("Error during manual member cleanup:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error", 
      error: "Failed to cleanup inactive members",
    } as ApiResponse<null>);
  }
};

// Update pending dues for all leaving requests
export const updateLeavingRequestDues = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "Admin authentication required",
      } as ApiResponse<null>);
      return;
    }

    const result = await updateLeavingRequestPendingDues();

    res.status(200).json({
      success: true,
      message: result.updatedRequests > 0 
        ? `Successfully updated pending dues for ${result.updatedRequests} leaving requests`
        : "No leaving request dues updates required",
      data: result,
    } as ApiResponse<any>);

  } catch (error) {
    console.error("Error during manual leaving request dues update:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error", 
      error: "Failed to update leaving request dues",
    } as ApiResponse<null>);
  }
};

// Add a new member to PG
export const addMember = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "Admin authentication required",
      } as ApiResponse<null>);
      return;
    }

    const {
      name,
      dob,
      location,
      email,
      phone,
      work,
      rentType,
      rentAmount,
      advanceAmount,
      pricePerDay,
      pgId,
      roomId,
      dateOfJoining,
      dateOfRelieving,
    }: AdminAddMemberRequest = req.body;

    // Handle uploaded files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const profileImage = files?.profileImage?.[0];
    const documentImage = files?.documentImage?.[0];

    // Store temp file names for later processing
    const tempFiles: { profile?: string; document?: string } = {};
    if (profileImage) tempFiles.profile = profileImage.filename;
    if (documentImage) tempFiles.document = documentImage.filename;

    // Verify PG exists and admin has access to it
    const pg = await prisma.pG.findUnique({
      where: { id: pgId },
    });

    if (!pg) {
      res.status(404).json({
        success: false,
        message: "PG not found",
        error: "The specified PG does not exist",
      } as ApiResponse<null>);
      return;
    }

    // Verify admin manages the correct PG type
    if (pg.type !== req.admin.pgType) {
      res.status(403).json({
        success: false,
        message: "Access denied",
        error: "You can only add members to PGs of your managed type",
      } as ApiResponse<null>);
      return;
    }

    // Validate additional fields for short-term members
    if (rentType === "SHORT_TERM") {
      if (!pricePerDay || pricePerDay <= 0) {
        res.status(400).json({
          success: false,
          message: "pricePerDay is required and must be greater than 0 for short-term members",
        } as ApiResponse<null>);
        return;
      }

      if (!dateOfRelieving) {
        res.status(400).json({
          success: false,
          message: "dateOfRelieving is required for short-term members",
        } as ApiResponse<null>);
        return;
      }

      // Validate that date of relieving is after joining date
      const joiningDateObj = dateOfJoining ? new Date(dateOfJoining) : new Date();
      const dateOfRelievingObj = new Date(dateOfRelieving);

      if (dateOfRelievingObj <= joiningDateObj) {
        res.status(400).json({
          success: false,
          message: "Date of relieving must be after joining date for short-term members",
        } as ApiResponse<null>);
        return;
      }
    }

    // Check if member with email or phone already exists
    const existingMember = await prisma.member.findFirst({
      where: {
        OR: [
          { email },
          { phone },
        ],
      },
    });

    if (existingMember) {
      res.status(409).json({
        success: false,
        message: "Member already exists",
        error: "A member with this email or phone number already exists",
      } as ApiResponse<null>);
      return;
    }

    // Verify room exists and belongs to the PG (if roomId provided)
    if (roomId) {
      const room = await prisma.room.findFirst({
        where: {
          id: roomId,
          pGId: pgId,
        },
      });

      if (!room) {
        res.status(404).json({
          success: false,
          message: "Room not found",
          error: "The specified room does not exist in this PG",
        } as ApiResponse<null>);
        return;
      }

      // Check room capacity
      const currentOccupancy = await prisma.member.count({
        where: {
          roomId,
          isActive: true,
        },
      });

      if (currentOccupancy >= room.capacity) {
        res.status(400).json({
          success: false,
          message: "Room is full",
          error: "The selected room has reached its maximum capacity",
        } as ApiResponse<null>);
        return;
      }
    }

    // Determine gender based on admin's PG type
    const gender: Gender = req.admin.pgType === 'MENS' ? 'MALE' : 'FEMALE';

    // Generate unique member ID
    const memberId = await generateUniqueMemberId();

    // Parse dates
    const joiningDate = dateOfJoining ? new Date(dateOfJoining) : new Date();
    const memberDateOfRelieving = dateOfRelieving ? new Date(dateOfRelieving) : null;

    // Create transaction to create member and initial payment record
    const result = await prisma.$transaction(async (tx) => {
      // Create the member
      const newMember = await tx.member.create({
        data: {
          memberId,
          name,
          dob: new Date(dob),
          gender,
          location,
          email,
          phone,
          work,
          photoUrl: null, // Will be set after moving files
          documentUrl: null, // Will be set after moving files
          digitalSignature: null,
          rentType,
          rentAmount: parseFloat(String(rentAmount || "0")) || 0,
          advanceAmount: parseFloat(String(advanceAmount || "0")) || 0,
          pricePerDay: rentType === 'SHORT_TERM' ? parseFloat(String(pricePerDay || "0")) || 0 : null,
          pgType: req.admin!.pgType,
          pgId,
          roomId: roomId || null,
          dateOfJoining: joiningDate,
          dateOfRelieving: memberDateOfRelieving,
          isActive: true,
          isFirstTimeLogin: true,
        },
        include: {
          pg: true,
          room: true,
        },
      });

      // Create initial payment record for all approved members
      if (newMember.rentType === "LONG_TERM") {
        // Payment for current month of service, due next month
        const currentMonth = joiningDate.getMonth() + 1;
        const currentYear = joiningDate.getFullYear();

        const dueDate = new Date(joiningDate);
        dueDate.setMonth(dueDate.getMonth() + 1);

        // Handle month-end edge cases for due date
        const joiningDay = joiningDate.getDate();
        if (dueDate.getDate() !== joiningDay) {
          const lastDayOfDueMonth = new Date(
            dueDate.getFullYear(),
            dueDate.getMonth() + 1,
            0
          ).getDate();
          dueDate.setDate(Math.min(joiningDay, lastDayOfDueMonth));
        }

        const overdueDate = new Date(dueDate);
        overdueDate.setDate(overdueDate.getDate() + 7);

        const paymentAmount = newMember.rentAmount || 0;

        await tx.payment.create({
          data: {
            memberId: newMember.id,
            pgId: newMember.pgId,
            month: currentMonth,
            year: currentYear,
            rentAmount: paymentAmount,
            electricityAmount: 0,
            totalAmount: paymentAmount,
            dueDate: dueDate,
            overdueDate: overdueDate,
            paymentStatus: "PENDING",
            approvalStatus: "PENDING",
          },
        });
      } else if (
        newMember.rentType === "SHORT_TERM" &&
        newMember.dateOfRelieving &&
        newMember.pricePerDay
      ) {
        // One-time payment based on number of days
        const endingDate = new Date(newMember.dateOfRelieving);
        const timeDifference = endingDate.getTime() - joiningDate.getTime();
        const numberOfDays = Math.ceil(timeDifference / (1000 * 3600 * 24));

        if (numberOfDays <= 0) {
          throw new Error("Invalid date range: ending date must be after joining date");
        }

        const totalAmount = numberOfDays * newMember.pricePerDay;
        const dueDate = new Date(joiningDate);
        const overdueDate = new Date(dueDate);
        overdueDate.setDate(overdueDate.getDate() + 7);

        await tx.payment.create({
          data: {
            memberId: newMember.id,
            pgId: newMember.pgId,
            month: joiningDate.getMonth() + 1,
            year: joiningDate.getFullYear(),
            rentAmount: totalAmount,
            electricityAmount: 0,
            totalAmount: totalAmount,
            dueDate: dueDate,
            overdueDate: overdueDate,
            paymentStatus: "PAID",
            approvalStatus: "APPROVED",
            paidDate: new Date(),
            approvedAt: new Date(),
            approvedBy: req.admin?.id,
          },
        });
      }

      return newMember;
    });

    // Move uploaded files to proper user directory and update member record
    if (tempFiles.profile || tempFiles.document) {
      try {
        const movedFiles = await moveUploadedFiles(result.id, tempFiles);
        
        // Update member record with proper image URLs
        const updateData: any = {};
        if (movedFiles.profileImage) updateData.photoUrl = movedFiles.profileImage;
        if (movedFiles.documentImage) updateData.documentUrl = movedFiles.documentImage;
        
        if (Object.keys(updateData).length > 0) {
          await prisma.member.update({
            where: { id: result.id },
            data: updateData
          });
          
          // Update the result object with the new URLs
          Object.assign(result, updateData);
        }
      } catch (fileError) {
        console.error("Error processing uploaded files:", fileError);
        // Continue with member creation even if file processing fails
      }
    }

    // Remove sensitive data from response
    const { password: _, ...memberResponse } = result;

    // Send approval notification email
    try {
      await sendApprovalNotification(result, req.admin?.id);
    } catch (emailError) {
      console.log("Member created successfully, but email notification failed : ", emailError);
    }

    res.status(201).json({
      success: true,
      message: getApprovalSuccessMessage(result.rentType),
      data: memberResponse,
    } as ApiResponse<any>);

  } catch (error) {
    console.error("Error adding member:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to add member",
    } as ApiResponse<null>);
  }
};

// Mark a payment as paid and approved
export const markPaymentAsPaid = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "Admin authentication required",
      } as ApiResponse<null>);
      return;
    }

    const { paymentId } = req.params;
    const {
      paymentMethod,
      paidDate,
    }: MarkPaymentAsPaidRequest = req.body;

    // Handle uploaded files for online payments
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const rentBillScreenshot = files?.rentBillScreenshot?.[0];
    const electricityBillScreenshot = files?.electricityBillScreenshot?.[0];

    // Store temp file names for later processing
    const tempFiles: { rentBill?: string; electricityBill?: string } = {};
    if (rentBillScreenshot) tempFiles.rentBill = rentBillScreenshot.filename;
    if (electricityBillScreenshot) tempFiles.electricityBill = electricityBillScreenshot.filename;

    // Find the payment record first to get member ID for image URLs
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        member: {
          include: {
            pg: {
              select: {
                type: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        message: "Payment not found",
        error: "The specified payment record does not exist",
      } as ApiResponse<null>);
      return;
    }

    // Generate image URLs if files were uploaded (will be done after moving files)
    let rentBillUrl: string | null = null;
    let electricityBillUrl: string | null = null;

    // Verify admin can manage this payment (same pgType)
    if (payment.member.pg.type !== req.admin.pgType) {
      res.status(403).json({
        success: false,
        message: "Access denied",
        error: "You can only manage payments for members of your PG type",
      } as ApiResponse<null>);
      return;
    }

    // Check if payment is already approved
    if (payment.approvalStatus === "APPROVED") {
      res.status(400).json({
        success: false,
        message: "Payment already approved",
        error: "This payment has already been marked as paid and approved",
      } as ApiResponse<null>);
      return;
    }

    // Prepare initial update data (without file URLs)
    const updateData: any = {
      paymentStatus: "PAID",
      approvalStatus: "APPROVED",
      paymentMethod,
      paidDate: paidDate ? new Date(paidDate) : new Date(),
      approvedAt: new Date(),
      approvedBy: req.admin.id,
    };

    // Update the payment record first
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
      include: {
        member: {
          select: {
            id: true,
            memberId: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Move uploaded files to proper user directory and update payment record
    if (tempFiles.rentBill || tempFiles.electricityBill) {
      try {
        const movedFiles = await movePaymentFiles(payment.member.id, tempFiles);
        
        // Update payment record with proper image URLs if files were moved
        const fileUpdateData: any = {};
        if (movedFiles.rentBillUrl) {
          fileUpdateData.rentBillScreenshot = movedFiles.rentBillUrl;
          rentBillUrl = movedFiles.rentBillUrl;
        }
        if (movedFiles.electricityBillUrl) {
          fileUpdateData.electricityBillScreenshot = movedFiles.electricityBillUrl;
          electricityBillUrl = movedFiles.electricityBillUrl;
        }
        
        if (Object.keys(fileUpdateData).length > 0) {
          await prisma.payment.update({
            where: { id: paymentId },
            data: fileUpdateData
          });
        }
      } catch (fileError) {
        console.error("Error processing payment files:", fileError);
        // Continue with payment approval even if file processing fails
      }
    }

    res.status(200).json({
      success: true,
      message: `Payment marked as paid via ${paymentMethod.toLowerCase()} and approved successfully`,
      data: {
        payment: updatedPayment,
        memberInfo: {
          memberId: updatedPayment.member.memberId,
          memberName: updatedPayment.member.name,
          memberEmail: updatedPayment.member.email,
        },
        approvalDetails: {
          approvedBy: req.admin.id,
          approvedAt: updateData.approvedAt,
          paymentMethod,
          hasProofDocuments: !!(rentBillUrl || electricityBillUrl),
        },
      },
    } as ApiResponse<any>);

  } catch (error) {
    console.error("Error marking payment as paid:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to mark payment as paid",
    } as ApiResponse<null>);
  }
};
