import { Response } from "express";
import prisma from "../config/prisma";
import { ApiResponse } from "../types/response";
import {
  ApproveRejectMemberRequest,
} from "../types/request";
import { AuthenticatedRequest } from "../middlewares/auth";
import { generateUniqueMemberId } from "../utils/memberIdGenerator";
import { deleteImage, ImageType } from "../utils/imageUpload";
import { 
  sendRejectionNotification, 
  sendApprovalNotification, 
  getApprovalSuccessMessage 
} from "../utils/memberNotificationHelper";

export const getRegisteredMembers = async (
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

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const search = req.query.search as string;
    const rentType = req.query.rentType as string;
    const whereClause: any = {
      pgType: admin.pgType,
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (rentType) {
      whereClause.rentType = rentType;
    }

    const total = await prisma.registeredMember.count({
      where: whereClause,
    });

    const registeredMembers = await prisma.registeredMember.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      message: "Registered members retrieved successfully",
      data: registeredMembers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error getting registered members:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve registered members",
    } as ApiResponse<null>);
  }
};

export const approveOrRejectMember = async (
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

    const { id } = req.params;
    const {
      status,
      pgId,
      roomId,
      advanceAmount,
      dateOfJoining,
      pricePerDay,
      rentAmount,
      dateOfRelieving,
    }: ApproveRejectMemberRequest = req.body;

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid status. Must be APPROVED or REJECTED",
      } as ApiResponse<null>);
      return;
    }

    const registeredMember = await prisma.registeredMember.findUnique({
      where: { id },
    });

    if (!registeredMember) {
      res.status(404).json({
        success: false,
        message: "Registered member not found",
      } as ApiResponse<null>);
      return;
    }

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

    // Verify admin can manage this registered member (same pgType)
    if (registeredMember.pgType !== admin.pgType) {
      res.status(403).json({
        success: false,
        message: "You can only manage members of your PG type",
      } as ApiResponse<null>);
      return;
    }

    if (status === "REJECTED") {
      await prisma.registeredMember.delete({
        where: { id },
      });

      // Send rejection email notification
      try {
        await sendRejectionNotification(registeredMember);
      } catch (emailError) {
        // Continue with the process even if email fails
      }

      await deleteImage(registeredMember.photoUrl || "", ImageType.PROFILE);
      await deleteImage(registeredMember.documentUrl || "", ImageType.DOCUMENT);

      res.status(200).json({
        success: true,
        message: "Member registration rejected and removed successfully",
      } as ApiResponse<null>);
      return;
    }

    // For APPROVED status, validate additional required fields
    if (!pgId) {
      res.status(400).json({
        success: false,
        message: "pgId is required for approval",
      } as ApiResponse<null>);
      return;
    }

    // Validate additional fields for short-term members
    if (registeredMember.rentType === "SHORT_TERM") {
      if (!pricePerDay || pricePerDay <= 0) {
        res.status(400).json({
          success: false,
          message:
            "pricePerDay is required and must be greater than 0 for short-term members",
        } as ApiResponse<null>);
        return;
      }

      if (!dateOfRelieving) {
        res.status(400).json({
          success: false,
          message: "endingDate is required for short-term members",
        } as ApiResponse<null>);
        return;
      }

      // Validate that date of relieving is after joining date
      const joiningDateObj = dateOfJoining
        ? new Date(dateOfJoining)
        : new Date();
      const dateOfRelievingObj = new Date(dateOfRelieving);

      if (dateOfRelievingObj <= joiningDateObj) {
        res.status(400).json({
          success: false,
          message:
            "Date of relieving must be after joining date for short-term members",
        } as ApiResponse<null>);
        return;
      }
    }

    const pg = await prisma.pG.findUnique({
      where: { id: pgId },
    });

    if (!pg) {
      res.status(404).json({
        success: false,
        message: "PG not found",
      } as ApiResponse<null>);
      return;
    }

    if (pg.type !== admin.pgType) {
      res.status(403).json({
        success: false,
        message: "PG type does not match your admin type",
      } as ApiResponse<null>);
      return;
    }

    // Validate room if roomId is provided
    if (roomId) {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
      });

      if (!room) {
        res.status(404).json({
          success: false,
          message: "Room not found",
        } as ApiResponse<null>);
        return;
      }

      if (room.pGId !== pgId) {
        res.status(400).json({
          success: false,
          message: "Room does not belong to the specified PG",
        } as ApiResponse<null>);
        return;
      }

      // Check room capacity
      const currentOccupancy = await prisma.member.count({
        where: { roomId: room.id },
      });

      if (currentOccupancy >= room.capacity) {
        res.status(400).json({
          success: false,
          message: "Room is at full capacity",
        } as ApiResponse<null>);
        return;
      }
    }

    const uniqueMemberId = await generateUniqueMemberId();

    const joiningDate = dateOfJoining ? new Date(dateOfJoining) : new Date();
    const memberDateOfRelieving =
      registeredMember.rentType === "SHORT_TERM" && dateOfRelieving
        ? new Date(dateOfRelieving)
        : registeredMember.dateOfRelieving;

    // Create transaction to move from RegisteredMember to Member
    const result = await prisma.$transaction(async (tx) => {
      const newMember = await tx.member.create({
        data: {
          memberId: uniqueMemberId,
          name: registeredMember.name,
          dob: registeredMember.dob,
          gender: registeredMember.gender,
          location: registeredMember.location,
          email: registeredMember.email,
          phone: registeredMember.phone,
          work: registeredMember.work,
          photoUrl: registeredMember.photoUrl,
          documentUrl: registeredMember.documentUrl,
          rentType: registeredMember.rentType,
          rentAmount: parseFloat(String(rentAmount || "0")) || 0,
          dateOfRelieving: memberDateOfRelieving,
          advanceAmount: parseFloat(String(advanceAmount || "0")) || 0,
          pricePerDay:
            registeredMember.rentType === "SHORT_TERM"
              ? parseFloat(String(pricePerDay || "0")) || 0
              : null,
          pgType: registeredMember.pgType,
          pgId,
          roomId,
          dateOfJoining: joiningDate,
        },
        include: {
          pg: {
            select: {
              id: true,
              name: true,
              type: true,
              location: true,
            },
          },
          room: {
            select: {
              id: true,
              roomNo: true,
              capacity: true,
            },
          },
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

      await tx.registeredMember.delete({
        where: { id },
      });
      return newMember;
    });

    // Send approval email notification
    try {
      await sendApprovalNotification(result, req.admin?.id);
    } catch (emailError) {
      console.log(emailError);
    }

    res.status(201).json({
      success: true,
      message: getApprovalSuccessMessage(result.rentType),
      data: result,
    } as ApiResponse<any>);
  } catch (error) {
    console.error("Error approving/rejecting member:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "Failed to process member approval/rejection",
    } as ApiResponse<null>);
  }
};
