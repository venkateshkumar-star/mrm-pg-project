import { Member, RegisteredMember, RentType, PgType } from "@prisma/client";
import prisma from "../config/prisma";
import { generateSecureOTP, hashOTP } from "./auth";
import {
  sendEmail,
  createApprovalEmailContent,
  createRejectionEmailContent,
} from "../services/emailService";

// Type for member with relations for approval email
type MemberWithRelations = Member & {
  pg: {
    id: string;
    name: string;
    type: PgType;
    location: string;
  };
  room?: {
    id: string;
    roomNo: string;
    capacity: number;
  } | null;
};

/**
 * Send rejection email notification to a registered member
 * @param registeredMember - The registered member being rejected
 */
export const sendRejectionNotification = async (
  registeredMember: RegisteredMember
): Promise<void> => {
  try {
    const emailContent = createRejectionEmailContent(
      registeredMember.name,
      registeredMember.pgType
    );
    
    await sendEmail({
      to: registeredMember.email,
      subject: `Application Update - ${registeredMember.name}`,
      body: emailContent,
    });
    
    console.log(`Rejection email sent to ${registeredMember.email}`);
  } catch (emailError) {
    console.error("Failed to send rejection email:", emailError);
    throw emailError; // Re-throw to allow caller to handle if needed
  }
};

/**
 * Send approval email notification to a newly approved member
 * Includes OTP generation for long-term members
 * @param member - The approved member with PG and room relations
 * @param adminId - ID of the admin who approved the member (optional)
 */
export const sendApprovalNotification = async (
  member: MemberWithRelations,
  adminId?: string
): Promise<void> => {
  try {
    let otpCode: string | undefined = undefined;
    
    // For long-term members, generate OTP and include in approval email
    if (member.rentType === "LONG_TERM") {
      // Generate OTP
      otpCode = generateSecureOTP();
      console.log(`Generated OTP for member ${member.email}: ${otpCode}`);
      const hashedOTP = await hashOTP(otpCode);

      // Delete existing unused OTPs for this member of INITIAL_SETUP type
      await prisma.oTP.deleteMany({
        where: {
          memberId: member.id,
          type: 'INITIAL_SETUP',
        },
      });

      // Create new OTP record
      await prisma.oTP.create({
        data: {
          memberId: member.id,
          email: member.email,
          code: hashedOTP,
          type: 'INITIAL_SETUP',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });
    }

    // Create email content
    const emailContent = createApprovalEmailContent(
      member.name,
      member.memberId,
      member.pg.name,
      member.pg.location,
      member.room?.roomNo,
      member.rentType === "LONG_TERM" ? (member.rentAmount || 0) : undefined,
      member.advanceAmount,
      member.dateOfJoining,
      member.rentType,
      member.pricePerDay || undefined,
      member.dateOfRelieving || undefined,
      otpCode
    );

    // Send approval email
    await sendEmail({
      to: member.email,
      subject: `🎉 Application Approved - Welcome to ${member.pg.name}!`,
      body: emailContent,
    });

    console.log(`Approval email sent to ${member.email}${otpCode ? ' with initial setup OTP' : ''}`);
  } catch (emailError) {
    console.error("Failed to send approval email:", emailError);
    throw emailError; // Re-throw to allow caller to handle if needed
  }
};

/**
 * Generate success message for member approval based on rent type
 * @param rentType - The rent type of the approved member
 * @returns Appropriate success message
 */
export const getApprovalSuccessMessage = (rentType: RentType): string => {
  return rentType === "LONG_TERM" 
    ? "Member approved and created successfully. Initial setup OTP is included in the approval email (valid for 24 hours)."
    : "Member approved and created successfully.";
};