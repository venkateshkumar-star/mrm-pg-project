import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Helper function to delete a user's entire upload folder
const deleteUserUploadFolder = (userUuid: string): number => {
  let deletedCount = 0;
  const userDir = path.join(process.cwd(), 'uploads', userUuid);
  
  if (fs.existsSync(userDir)) {
    try {
      // Recursively delete all files and subdirectories
      const deleteRecursive = (dirPath: string): void => {
        if (fs.existsSync(dirPath)) {
          fs.readdirSync(dirPath).forEach((file) => {
            const curPath = path.join(dirPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
              deleteRecursive(curPath);
            } else {
              fs.unlinkSync(curPath);
              deletedCount++;
            }
          });
          fs.rmdirSync(dirPath);
        }
      };
      
      deleteRecursive(userDir);
      console.log(`Deleted user folder: ${userUuid}`);
    } catch (error) {
      console.error(`Failed to delete user folder: ${userUuid}`, error);
    }
  }
  
  return deletedCount;
};

// Helper function to delete individual file (for old flat structure)
const deleteFileIfExists = (fileUrl: string | null): boolean => {
  if (!fileUrl) return false;
  
  try {
    const baseUploadPath = path.join(process.cwd(), 'uploads');
    const filePath = path.join(baseUploadPath, fileUrl.replace('/uploads/', ''));
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (error) {
    console.error(`Failed to delete file: ${fileUrl}`, error);
  }
  
  return false;
};

export const cleanupInactiveMemberData = async () => {
  try {
    const inactiveMembers = await prisma.member.findMany({
      where: { isActive: false },
      select: {
        id: true,
        memberId: true,
        name: true,
        email: true,
        phone: true,
        photoUrl: true,
        documentUrl: true,
        digitalSignature: true,
        dateOfJoining: true,
        dateOfRelieving: true,
        pg: {
          select: {
            name: true,
            location: true
          }
        },
        room: {
          select: {
            roomNo: true
          }
        },
        payment: {
          select: {
            id: true,
            rentBillScreenshot: true,
            electricityBillScreenshot: true
          }
        },
        leavingRequests: {
          select: {
            id: true,
            settlementProof: true
          }
        }
      }
    });

    if (inactiveMembers.length === 0) {
      return { 
        deletedMembers: 0, 
        deletedFiles: 0,
        deletedPaymentRecords: 0,
        deletedLeavingRequests: 0,
        memberDetails: [] 
      };
    }

    let totalDeletedFiles = 0;
    let totalPaymentRecords = 0;
    let totalLeavingRequests = 0;
    const memberDetails: any[] = [];

    // Clean up files and collect details for each inactive member
    for (const member of inactiveMembers) {
      let memberDeletedFiles = 0;
      
      // Try to delete user's UUID-based folder first (new structure)
      memberDeletedFiles += deleteUserUploadFolder(member.id);
      
      // Also try to delete individual files (old flat structure - backward compatibility)
      if (memberDeletedFiles === 0) {
        const filesToDelete = [
          member.photoUrl,
          member.documentUrl,
          member.digitalSignature,
          ...member.payment.flatMap(p => [p.rentBillScreenshot, p.electricityBillScreenshot]),
          ...member.leavingRequests.map(lr => lr.settlementProof)
        ].filter(Boolean);

        for (const fileUrl of filesToDelete) {
          if (deleteFileIfExists(fileUrl)) {
            memberDeletedFiles++;
          }
        }
      }
      
      totalDeletedFiles += memberDeletedFiles;
      totalPaymentRecords += member.payment.length;
      totalLeavingRequests += member.leavingRequests.length;
      
      memberDetails.push({
        memberId: member.memberId,
        name: member.name,
        email: member.email,
        phone: member.phone,
        pgName: member.pg?.name || 'N/A',
        pgLocation: member.pg?.location || 'N/A',
        roomNo: member.room?.roomNo || 'N/A',
        dateOfJoining: member.dateOfJoining,
        dateOfRelieving: member.dateOfRelieving,
        paymentRecordsDeleted: member.payment.length,
        leavingRequestsDeleted: member.leavingRequests.length,
        filesDeleted: memberDeletedFiles
      });
    }


    const deletionResult = await prisma.member.deleteMany({
      where: { isActive: false }
    });

    console.log(`Cleanup completed: ${deletionResult.count} members, ${totalDeletedFiles} files, ${totalPaymentRecords} payments, ${totalLeavingRequests} leaving requests deleted`);

    return {
      deletedMembers: deletionResult.count,
      deletedFiles: totalDeletedFiles,
      deletedPaymentRecords: totalPaymentRecords,
      deletedLeavingRequests: totalLeavingRequests,
      memberDetails
    };

  } catch (error) {
    console.error('Error during inactive member cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};