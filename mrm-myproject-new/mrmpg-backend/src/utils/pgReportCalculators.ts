import { PrismaClient, PgType, ReportType } from "@prisma/client";

const prisma = new PrismaClient();

export interface ReportCardsData {
  newMembers: number;
  newMembersTrendPercent: number;
  rentCollected: number;
  rentCollectedTrendPercent: number;
  memberDepartures: number;
  memberDeparturesTrendPercent: number;
  totalExpenses: number;
  totalExpensesTrendPercent: number;
  netProfit: number;
  netProfitTrendPercent: number;
}

export interface CompleteReportData {
  cards: ReportCardsData;
  tables: {
    pgPerformanceData: PGPerformanceData[];
    roomUtilizationData: RoomUtilizationData[];
    paymentAnalyticsData: PaymentAnalyticsData[];
    financialSummaryData: FinancialSummaryData[];
  };
}

export interface PGPerformanceData {
  pgId: string;
  pgName: string;
  pgLocation: string;
  pgType: string;
  totalMembers: number;
  newMembersThisWeek: number;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  occupancyRate: number;
  weeklyRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  totalExpenses: number;
  totalElectricityCharges: number;
  pendingLeavingRequests: number;
  approvedLeavingRequests: number;
  netRevenue: number;
  avgRentPerRoom: number;
}

export interface RoomUtilizationData {
  pgName: string;
  pgLocation: string;
  roomNo: string;
  roomId: string;
  capacity: number;
  currentOccupants: number;
  utilizationRate: number;
  totalAmount: number;
  electricityCharge: number;
  weeklyRevenue: number;
  availableSlots: number;
  totalMonthlyEarnings: number;
  revenuePerOccupant: number;
  electricityPerOccupant: number;
  revenueEfficiency: number;
}

export interface PaymentAnalyticsData {
  pgName: string;
  pgLocation: string;
  totalMembers: number;
  paymentsReceived: number;
  paymentsApproved: number;
  paymentsPending: number;
  paymentsOverdue: number;
  totalAmountReceived: number;
  totalAmountApproved: number;
  totalAmountPending: number;
  totalAmountOverdue: number;
  avgPaymentAmount: number;
  totalExpectedRevenue: number;
  shortfallAmount: number;
  collectionEfficiency: number;
}

export interface FinancialSummaryData {
  pgName: string;
  pgLocation: string;
  expectedRevenue: number;
  actualRevenue: number;
  pendingRevenue: number;
  overdueRevenue: number;
  advanceCollected: number;
  totalCashInflow: number;
  revenueVariance: number;
  cashFlowStatus: string;
  collectionTrend: number;
}

// Helper function to calculate PG performance data with improved payment logic
export const calculatePGPerformance = async (
  prisma: any,
  pgIds: string[],
  startDate: Date,
  endDate: Date
): Promise<PGPerformanceData[]> => {
  // Update overdue payment statuses in real-time before calculating stats
  const currentTime = new Date();
  await prisma.payment.updateMany({
    where: {
      pgId: { in: pgIds },
      approvalStatus: "PENDING",
      paymentStatus: "PENDING", // Only update PENDING to OVERDUE
      overdueDate: {
        lt: currentTime, // overdue date has passed
      },
    },
    data: {
      paymentStatus: "OVERDUE",
    },
  });

  const pgs = await prisma.pG.findMany({
    where: { id: { in: pgIds } },
    include: {
      members: {
        include: {
          payment: {
            where: {
              OR: [
                { createdAt: { gte: startDate, lte: endDate } },
                { dueDate: { gte: startDate, lte: endDate } },
              ],
            },
          },
        },
      },
      rooms: {
        include: {
          members: true,
          electricityCharges: {
            where: {
              createdAt: { gte: startDate, lte: endDate }
            }
          }
        },
      },
      leavingRequests: {
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      },
      expenses: {
        where: {
          date: { gte: startDate, lte: endDate },
          entryType: 'CASH_OUT'
        }
      },
      electricityCharges: {
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }
    },
  });

  return pgs.map((pg: any) => {
    const totalMembers = pg.members.length;
    const newMembersThisWeek = pg.members.filter((m: any) =>
      m.createdAt >= startDate && m.createdAt <= endDate
    ).length;

    const totalRooms = pg.rooms.length;
    const occupiedRooms = pg.rooms.filter((r: any) => r.members.length > 0).length;
    const vacantRooms = totalRooms - occupiedRooms;
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    // Get all payments for this PG in the time range
    const allPayments = pg.members.flatMap((m: any) => m.payment);
    
    // Filter payments that actually belong to this reporting period
    // A payment belongs to the period if it was paid in the period OR was due in the period
    const periodPayments = allPayments.filter((p: any) => {
      const paidInPeriod = p.paidDate && p.paidDate >= startDate && p.paidDate <= endDate;
      const dueInPeriod = p.dueDate >= startDate && p.dueDate <= endDate;
      return paidInPeriod || dueInPeriod;
    });
    
    const approvedPayments = periodPayments.filter((p: any) => p.approvalStatus === 'APPROVED');
    const pendingPayments = periodPayments.filter((p: any) => p.approvalStatus === 'PENDING').length;
    
    // Use proper overdue detection based on the reporting period
    // For historical reports, use endDate; for current period reports, use currentTime
    const isCurrentPeriod = endDate >= new Date(new Date().setHours(0, 0, 0, 0));
    const overdueCheckDate = isCurrentPeriod ? currentTime : endDate;
    
    const overduePayments = periodPayments.filter((p: any) => {
      // Payment is overdue if it's marked as OVERDUE OR if overdue date has passed during/before the period
      return p.paymentStatus === 'OVERDUE' || 
             (p.overdueDate && overdueCheckDate > new Date(p.overdueDate));
    }).length;

    // Calculate period revenue using approved payments from the period
    // Remove null safety as totalAmount should never be null in schema
    const periodRevenue = approvedPayments.reduce((sum: number, p: any) => 
      sum + p.totalAmount, 0);

    // Calculate total expenses for this PG in the period
    const totalExpenses = pg.expenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);

    // Calculate total electricity charges from ElectricityCharge model
    const totalElectricityCharges = pg.electricityCharges.reduce((sum: number, ec: any) => 
      sum + (ec.amount || 0), 0);

    // Calculate leaving requests within the reporting period
    const periodLeavingRequests = pg.leavingRequests.filter((lr: any) => 
      lr.createdAt >= startDate && lr.createdAt <= endDate
    );
    const pendingLeavingRequests = periodLeavingRequests.filter((lr: any) => lr.status === 'PENDING').length;
    const approvedLeavingRequests = periodLeavingRequests.filter((lr: any) => lr.status === 'APPROVED').length;

    // Calculate net revenue (revenue minus expenses)
    const netRevenue = periodRevenue - totalExpenses;

    // Calculate average rent per room - sum all member rents and divide by total rooms
    // This gives the average rent revenue potential per room
    const totalMemberRents = pg.members
      .filter((member: any) => member.roomId) // Only members with assigned rooms
      .reduce((sum: number, member: any) => sum + (member.rentAmount || 0), 0);
    
    const avgRentPerRoom = totalRooms > 0 ? Math.round(totalMemberRents / totalRooms) : 0;

    return {
      pgId: pg.id,
      pgName: pg.name,
      pgLocation: pg.location,
      pgType: pg.type,
      totalMembers,
      newMembersThisWeek,
      totalRooms,
      occupiedRooms,
      vacantRooms,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      weeklyRevenue: periodRevenue,
      pendingPayments,
      overduePayments,
      totalExpenses,
      totalElectricityCharges,
      pendingLeavingRequests,
      approvedLeavingRequests,
      netRevenue,
      avgRentPerRoom
    };
  });
};

// Helper function to calculate room utilization data
export const calculateRoomUtilization = async (
  prisma: any,
  pgIds: string[],
  startDate: Date,
  endDate: Date
): Promise<RoomUtilizationData[]> => {
  const rooms = await prisma.room.findMany({
    where: { pGId: { in: pgIds } },
    include: {
      PG: { select: { name: true, location: true } },
      members: {
        include: {
          payment: {
            where: {
              OR: [
                { createdAt: { gte: startDate, lte: endDate } },
                { dueDate: { gte: startDate, lte: endDate } },
              ],
              approvalStatus: 'APPROVED',
            },
          },
        },
      },
      electricityCharges: {
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }
    },
  });

  return rooms.map((room: any) => {
    const currentOccupants = room.members.length;
    const utilizationRate = room.capacity > 0 ? (currentOccupants / room.capacity) * 100 : 0;
    
    // Calculate available slots
    const availableSlots = room.capacity - currentOccupants;

    // Calculate period revenue for this room using payments that belong to the period
    // A payment belongs to the period if it was paid in the period OR was due in the period
    const periodRevenue = room.members
      .flatMap((m: any) => m.payment)
      .filter((p: any) => {
        const paidInPeriod = p.paidDate && p.paidDate >= startDate && p.paidDate <= endDate;
        const dueInPeriod = p.dueDate >= startDate && p.dueDate <= endDate;
        return paidInPeriod || dueInPeriod;
      })
      .reduce((sum: number, p: any) => sum + p.totalAmount, 0);

    // Calculate total amount from all payments for this room in the period
    const totalAmountFromRoom = periodRevenue;

    // Calculate average payment amount per member in this room for the period
    const totalPayments = room.members
      .flatMap((m: any) => m.payment)
      .filter((p: any) => {
        const paidInPeriod = p.paidDate && p.paidDate >= startDate && p.paidDate <= endDate;
        const dueInPeriod = p.dueDate >= startDate && p.dueDate <= endDate;
        return paidInPeriod || dueInPeriod;
      });

    const avgPaymentPerMember = totalPayments.length > 0 ? 
      totalAmountFromRoom / totalPayments.length : 0;

    // Calculate total monthly earnings potential based on average payment and full capacity
    // This represents the maximum possible monthly revenue if room is fully occupied
    const totalMonthlyEarnings = avgPaymentPerMember * room.capacity;

    // Calculate revenue per occupant for the reporting period
    const revenuePerOccupant = currentOccupants > 0 ? periodRevenue / currentOccupants : 0;

    // Calculate electricity cost per occupant from ElectricityCharge model
    const totalElectricityCharges = room.electricityCharges.reduce((sum: number, ec: any) => 
      sum + (ec.amount || 0), 0);
    const electricityPerOccupant = currentOccupants > 0 ? totalElectricityCharges / currentOccupants : 0;

    // Calculate revenue efficiency - compare actual period revenue with expected revenue
    // Expected revenue = avgPaymentPerMember * current active payments for the period
    const expectedPeriodRevenue = avgPaymentPerMember * totalPayments.length;
    const revenueEfficiency = expectedPeriodRevenue > 0 ? (periodRevenue / expectedPeriodRevenue) * 100 : 100;

    return {
      pgName: room.PG?.name || '',
      pgLocation: room.PG?.location || '',
      roomNo: room.roomNo,
      roomId: room.id,
      capacity: room.capacity,
      currentOccupants,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      totalAmount: Math.round(totalAmountFromRoom),
      electricityCharge: Math.round(totalElectricityCharges),
      weeklyRevenue: periodRevenue,
      availableSlots,
      totalMonthlyEarnings: Math.round(totalMonthlyEarnings),
      revenuePerOccupant: Math.round(revenuePerOccupant),
      electricityPerOccupant: Math.round(electricityPerOccupant),
      revenueEfficiency: Math.round(revenueEfficiency * 100) / 100,
    };
  });
};

// Helper function to calculate payment analytics data with improved overdue detection
export const calculatePaymentAnalytics = async (
  prisma: any,
  pgIds: string[],
  startDate: Date,
  endDate: Date
): Promise<PaymentAnalyticsData[]> => {
  // Update overdue payment statuses in real-time before calculating stats
  const currentTime = new Date();
  await prisma.payment.updateMany({
    where: {
      pgId: { in: pgIds },
      approvalStatus: "PENDING",
      paymentStatus: "PENDING", // Only update PENDING to OVERDUE
      overdueDate: {
        lt: currentTime, // overdue date has passed
      },
    },
    data: {
      paymentStatus: "OVERDUE",
    },
  });

  const pgs = await prisma.pG.findMany({
    where: { id: { in: pgIds } },
    include: {
      members: {
        where: {
          // Only include members who were active during the period
          dateOfJoining: { lte: endDate },
          OR: [
            { dateOfRelieving: null }, // Still active
            { dateOfRelieving: { gte: startDate } } // Left during or after the period
          ]
        },
        include: {
          payment: {
            where: {
              OR: [
                { createdAt: { gte: startDate, lte: endDate } },
                { dueDate: { gte: startDate, lte: endDate } },
              ],
            },
          },
        },
      },
    },
  });

  return pgs.map((pg: any) => {
    const allPayments = pg.members.flatMap((m: any) => m.payment);
    const totalMembers = pg.members.length;

    // Calculate payment counts with consistent overdue detection
    const paymentsReceived = allPayments.length;
    const paymentsApproved = allPayments.filter((p: any) => p.approvalStatus === 'APPROVED').length;
    const paymentsPending = allPayments.filter((p: any) => 
      p.approvalStatus === 'PENDING' && p.paymentStatus !== 'OVERDUE'
    ).length;
    const paymentsOverdue = allPayments.filter((p: any) => 
      p.paymentStatus === 'OVERDUE' || 
      (p.approvalStatus === 'PENDING' && p.overdueDate && currentTime > new Date(p.overdueDate))
    ).length;

    // Calculate payment amounts by status with consistent logic using new schema
    const totalAmountReceived = allPayments.reduce((sum: number, p: any) => sum + p.totalAmount, 0);
    
    const totalAmountApproved = allPayments
      .filter((p: any) => p.approvalStatus === 'APPROVED')
      .reduce((sum: number, p: any) => sum + p.totalAmount, 0);
    
    const totalAmountPending = allPayments
      .filter((p: any) => p.approvalStatus === 'PENDING' && p.paymentStatus !== 'OVERDUE')
      .reduce((sum: number, p: any) => sum + p.totalAmount, 0);
    
    const totalAmountOverdue = allPayments
      .filter((p: any) => 
        p.paymentStatus === 'OVERDUE' || 
        (p.approvalStatus === 'PENDING' && p.overdueDate && currentTime > new Date(p.overdueDate))
      )
      .reduce((sum: number, p: any) => sum + p.totalAmount, 0);

    // Calculate average payment amount (only for received payments)
    const avgPaymentAmount = paymentsReceived > 0 ? totalAmountReceived / paymentsReceived : 0;

    // Calculate expected revenue for active members in the period using new schema
    // This represents the expected revenue for payments that should have been made during this period
    const totalExpectedRevenue = pg.members.reduce((sum: number, m: any) => {
      // Only count members who have assigned rooms
      if (!m.roomId) return sum;
      
      const memberJoinDate = new Date(m.dateOfJoining);
      const memberLeaveDate = m.dateOfRelieving ? new Date(m.dateOfRelieving) : null;
      
      // Determine the effective start and end dates for this member in the period
      const effectiveStart = memberJoinDate > startDate ? memberJoinDate : startDate;
      const effectiveEnd = memberLeaveDate && memberLeaveDate < endDate ? memberLeaveDate : endDate;
      
      // If member was not active during this period, skip
      if (effectiveStart > effectiveEnd) return sum;
      
      // Calculate the number of days the member was active in the period
      const totalPeriodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const activeDays = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Prorate the rent amount based on active days in the period
      const proratedRent = m.rentAmount * (activeDays / totalPeriodDays);
      
      return sum + proratedRent;
    }, 0);

    // Calculate shortfall (expected vs approved) - this shows uncollected revenue
    const shortfallAmount = Math.max(0, totalExpectedRevenue - totalAmountApproved);

    // Calculate collection efficiency (approved amount vs expected revenue)
    const collectionEfficiency = totalExpectedRevenue > 0 ? (totalAmountApproved / totalExpectedRevenue) * 100 : 0;

    return {
      pgName: pg.name,
      pgLocation: pg.location,
      totalMembers,
      paymentsReceived,
      paymentsApproved,
      paymentsPending,
      paymentsOverdue,
      totalAmountReceived,
      totalAmountApproved,
      totalAmountPending,
      totalAmountOverdue,
      avgPaymentAmount: Math.round(avgPaymentAmount),
      totalExpectedRevenue: Math.round(totalExpectedRevenue),
      shortfallAmount: Math.round(shortfallAmount),
      collectionEfficiency: Math.round(collectionEfficiency * 100) / 100,
    };
  });
};

// Helper function to calculate financial summary data with improved overdue detection
export const calculateFinancialSummary = async (
  prisma: any,
  pgIds: string[],
  startDate: Date,
  endDate: Date
): Promise<FinancialSummaryData[]> => {
  // Update overdue payment statuses in real-time before calculating stats
  const currentTime = new Date();
  await prisma.payment.updateMany({
    where: {
      pgId: { in: pgIds },
      approvalStatus: "PENDING",
      paymentStatus: "PENDING", // Only update PENDING to OVERDUE
      overdueDate: {
        lt: currentTime, // overdue date has passed
      },
    },
    data: {
      paymentStatus: "OVERDUE",
    },
  });

  const pgs = await prisma.pG.findMany({
    where: { id: { in: pgIds } },
    include: {
      members: {
        include: {
          payment: {
            where: {
              OR: [
                { createdAt: { gte: startDate, lte: endDate } },
                { dueDate: { gte: startDate, lte: endDate } },
              ],
            },
          },
        },
      },
    },
  });

  return pgs.map((pg: any) => {
    const allPayments = pg.members.flatMap((m: any) => m.payment);
    
    // Calculate revenue streams with improved overdue detection
    const actualRevenue = allPayments
      .filter((p: any) => p.approvalStatus === 'APPROVED')
      .reduce((sum: number, p: any) => sum + p.totalAmount, 0);
    
    // Calculate pending revenue (pending payments that are NOT overdue)
    const pendingRevenue = allPayments
      .filter((p: any) => p.approvalStatus === 'PENDING' && p.paymentStatus !== 'OVERDUE')
      .reduce((sum: number, p: any) => sum + p.totalAmount, 0);
    
    // Calculate overdue revenue (payments that are marked as overdue OR have passed overdue date)
    const overdueRevenue = allPayments
      .filter((p: any) => 
        p.paymentStatus === 'OVERDUE' || 
        (p.approvalStatus === 'PENDING' && p.overdueDate && currentTime > new Date(p.overdueDate))
      )
      .reduce((sum: number, p: any) => sum + p.totalAmount, 0);

    // Calculate expected revenue based on member rents for active members in the period
    // This should match the logic used in Payment Analytics for consistency
    const expectedRevenue = pg.members
      .filter((m: any) => {
        // Only include members who were active during the period
        const memberJoinDate = new Date(m.dateOfJoining);
        const memberLeaveDate = m.dateOfRelieving ? new Date(m.dateOfRelieving) : null;
        
        // Member was active if they joined before/during period AND (still active OR left after period started)
        return memberJoinDate <= endDate && 
               (!memberLeaveDate || memberLeaveDate >= startDate);
      })
      .reduce((sum: number, m: any) => {
        // Only count members who have assigned rooms
        if (!m.roomId) return sum;
        
        const memberJoinDate = new Date(m.dateOfJoining);
        const memberLeaveDate = m.dateOfRelieving ? new Date(m.dateOfRelieving) : null;
        
        // Determine the effective start and end dates for this member in the period
        const effectiveStart = memberJoinDate > startDate ? memberJoinDate : startDate;
        const effectiveEnd = memberLeaveDate && memberLeaveDate < endDate ? memberLeaveDate : endDate;
        
        // Calculate the number of days the member was active in the period
        const totalPeriodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const activeDays = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Prorate the rent amount based on active days in the period
        const proratedRent = m.rentAmount * (activeDays / totalPeriodDays);
        
        return sum + proratedRent;
      }, 0);

    // Calculate advance collected from new members who joined during the period
    const advanceCollected = pg.members
      .filter((m: any) => m.createdAt >= startDate && m.createdAt <= endDate)
      .reduce((sum: number, m: any) => sum + (m.advanceAmount || 0), 0);

    const totalCashInflow = actualRevenue + advanceCollected;
    const revenueVariance = expectedRevenue > 0 ? 
      ((actualRevenue - expectedRevenue) / expectedRevenue) * 100 : 0;

    const cashFlowStatus = totalCashInflow >= expectedRevenue ? 'Positive' : 'Negative';

    // Calculate collection trend (simplified - comparing with previous period would need additional logic)
    const collectionTrend = 0; // Placeholder - would need previous period data

    return {
      pgName: pg.name,
      pgLocation: pg.location,
      expectedRevenue,
      actualRevenue,
      pendingRevenue,
      overdueRevenue,
      advanceCollected,
      totalCashInflow,
      revenueVariance: Math.round(revenueVariance * 100) / 100,
      cashFlowStatus,
      collectionTrend,
    };
  });
};

export const computeCompleteReportData = async (
  pgType: PgType,
  reportType: ReportType,
  period: number,
  year: number,
  periodStart: Date,
  periodEnd: Date
): Promise<CompleteReportData> => {
  try {
    // Get all PGs of the specified type
    const pgs = await prisma.pG.findMany({
      where: { type: pgType },
      select: { id: true }
    });
    
    const pgIds = pgs.map(pg => pg.id);
    
    if (pgIds.length === 0) {
      throw new Error(`No PGs found for type: ${pgType}`);
    }

    // Calculate previous period dates for trend comparison
    const { prevPeriodStart, prevPeriodEnd } = getPreviousPeriodDates(
      reportType, period, year, periodStart, periodEnd
    );

    // Compute all report data in parallel for efficiency
    const [
      currentCards,
      previousCards,
      pgPerformanceData,
      roomUtilizationData,
      paymentAnalyticsData,
      financialSummaryData
    ] = await Promise.all([
      calculateReportCards(pgIds, periodStart, periodEnd),
      calculateReportCards(pgIds, prevPeriodStart, prevPeriodEnd),
      calculatePGPerformance(prisma, pgIds, periodStart, periodEnd),
      calculateRoomUtilization(prisma, pgIds, periodStart, periodEnd),
      calculatePaymentAnalytics(prisma, pgIds, periodStart, periodEnd),
      calculateFinancialSummary(prisma, pgIds, periodStart, periodEnd)
    ]);

    // Calculate trend percentages
    const cardsWithTrends = calculateTrendPercentages(currentCards, previousCards);

    return {
      cards: cardsWithTrends,
      tables: {
        pgPerformanceData,
        roomUtilizationData,
        paymentAnalyticsData,
        financialSummaryData
      }
    };

  } catch (error) {
    console.error('Error computing complete report data:', error);
    throw error;
  }
};

/**
 * Get or compute report data - checks cache first, computes if needed
 * This is the main function called by controllers
 */
export const getOrComputeReportData = async (
  pgType: PgType,
  reportType: ReportType,
  period: number,
  year: number
): Promise<CompleteReportData> => {
  try {
    const { periodStart, periodEnd } = getPeriodDateRange(reportType, period, year);
    const isCurrentPeriod = checkIfCurrentPeriod(reportType, period, year);

    // For past periods, try to get cached data first
    if (!isCurrentPeriod) {
      const cachedReport = await getCachedReportData(pgType, reportType, period, year);
      if (cachedReport) {
        return formatCachedDataToCompleteReport(cachedReport);
      }
    }

    return await computeCompleteReportData(
      pgType, reportType, period, year, periodStart, periodEnd
    );

  } catch (error) {
    console.error('Error getting or computing report data:', error);
    throw error;
  }
};

/**
 * Cache computed report data to database
 * Used by scheduled jobs and manual caching
 */
export const cacheReportData = async (
  pgType: PgType,
  reportType: ReportType,
  period: number,
  year: number,
  reportData: CompleteReportData
): Promise<void> => {
  try {
    const { periodStart, periodEnd } = getPeriodDateRange(reportType, period, year);

    await prisma.report.upsert({
      where: {
        pgType_reportType_period_year: {
          pgType,
          reportType,
          period,
          year
        }
      },
      create: {
        pgType,
        reportType,
        period,
        year,
        periodStart,
        periodEnd,
        
        // Cards data
        newMembers: reportData.cards.newMembers,
        newMembersTrendPercent: reportData.cards.newMembersTrendPercent,
        rentCollected: reportData.cards.rentCollected,
        rentCollectedTrendPercent: reportData.cards.rentCollectedTrendPercent,
        memberDepartures: reportData.cards.memberDepartures,
        memberDeparturesTrendPercent: reportData.cards.memberDeparturesTrendPercent,
        totalExpenses: reportData.cards.totalExpenses,
        totalExpensesTrendPercent: reportData.cards.totalExpensesTrendPercent,
        netProfit: reportData.cards.netProfit,
        netProfitTrendPercent: reportData.cards.netProfitTrendPercent,
        
        // Table data as JSON
        pgPerformanceData: JSON.stringify(reportData.tables.pgPerformanceData),
        roomUtilizationData: JSON.stringify(reportData.tables.roomUtilizationData),
        paymentAnalyticsData: JSON.stringify(reportData.tables.paymentAnalyticsData),
        financialSummaryData: JSON.stringify(reportData.tables.financialSummaryData)
      },
      update: {
        periodStart,
        periodEnd,
        
        // Update cards data
        newMembers: reportData.cards.newMembers,
        newMembersTrendPercent: reportData.cards.newMembersTrendPercent,
        rentCollected: reportData.cards.rentCollected,
        rentCollectedTrendPercent: reportData.cards.rentCollectedTrendPercent,
        memberDepartures: reportData.cards.memberDepartures,
        memberDeparturesTrendPercent: reportData.cards.memberDeparturesTrendPercent,
        totalExpenses: reportData.cards.totalExpenses,
        totalExpensesTrendPercent: reportData.cards.totalExpensesTrendPercent,
        netProfit: reportData.cards.netProfit,
        netProfitTrendPercent: reportData.cards.netProfitTrendPercent,
        
        // Update table data as JSON
        pgPerformanceData: JSON.stringify(reportData.tables.pgPerformanceData),
        roomUtilizationData: JSON.stringify(reportData.tables.roomUtilizationData),
        paymentAnalyticsData: JSON.stringify(reportData.tables.paymentAnalyticsData),
        financialSummaryData: JSON.stringify(reportData.tables.financialSummaryData),
        
        updatedAt: new Date()
      }
    });

    console.log(`Cached report data: ${pgType} ${reportType} ${period}/${year}`);

  } catch (error) {
    console.error('Error caching report data:', error);
    throw error;
  }
};

/**
 * Scheduled job function to cache completed periods
 * Run this at the end of each week/month
 */
export const cacheCompletedPeriods = async (): Promise<void> => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentWeek = getWeekNumber(currentDate);

    console.log('Starting scheduled caching of completed periods...');

    // Cache last completed week for all PG types
    if (currentWeek > 1) {
      const lastWeek = currentWeek - 1;
      for (const pgType of ['MENS', 'WOMENS'] as PgType[]) {
        try {
          const { periodStart, periodEnd } = getPeriodDateRange('WEEKLY', lastWeek, currentYear);
          const reportData = await computeCompleteReportData(
            pgType, 'WEEKLY', lastWeek, currentYear, periodStart, periodEnd
          );
          await cacheReportData(pgType, 'WEEKLY', lastWeek, currentYear, reportData);
        } catch (error) {
          console.error(`Error caching weekly data for ${pgType}:`, error);
        }
      }
    }

    // Cache last completed month for all PG types
    if (currentMonth > 1) {
      const lastMonth = currentMonth - 1;
      for (const pgType of ['MENS', 'WOMENS'] as PgType[]) {
        try {
          const { periodStart, periodEnd } = getPeriodDateRange('MONTHLY', lastMonth, currentYear);
          const reportData = await computeCompleteReportData(
            pgType, 'MONTHLY', lastMonth, currentYear, periodStart, periodEnd
          );
          await cacheReportData(pgType, 'MONTHLY', lastMonth, currentYear, reportData);
        } catch (error) {
          console.error(`Error caching monthly data for ${pgType}:`, error);
        }
      }
    }

    console.log('Completed scheduled caching of completed periods');

  } catch (error) {
    console.error('Error in scheduled caching:', error);
    throw error;
  }
};

// ==================================================================
// HELPER FUNCTIONS
// ==================================================================

/**
 * Calculate report cards data for a specific period
 */
const calculateReportCards = async (
  pgIds: string[],
  startDate: Date,
  endDate: Date
): Promise<Omit<ReportCardsData, 'newMembersTrendPercent' | 'rentCollectedTrendPercent' | 'memberDeparturesTrendPercent' | 'totalExpensesTrendPercent' | 'netProfitTrendPercent'>> => {
  
  // Get new members count
  const newMembers = await prisma.member.count({
    where: {
      pgId: { in: pgIds },
      createdAt: { gte: startDate, lte: endDate }
    }
  });

  // Get member departures (approved leaving requests that were settled in the period)
  // Use settledDate if available, otherwise use updatedAt for approved requests
  const memberDepartures = await prisma.leavingRequest.count({
    where: {
      member: { pgId: { in: pgIds } },
      status: 'APPROVED',
      OR: [
        { settledDate: { gte: startDate, lte: endDate } },
        { 
          settledDate: null,
          updatedAt: { gte: startDate, lte: endDate }
        }
      ]
    }
  });

  // Calculate rent collected (approved payments) - using totalAmount from new schema
  const rentCollectedData = await prisma.payment.aggregate({
    where: {
      pgId: { in: pgIds },
      approvalStatus: 'APPROVED',
      paidDate: { gte: startDate, lte: endDate }
    },
    _sum: { totalAmount: true }
  });
  const rentCollected = rentCollectedData._sum?.totalAmount || 0;

  // Calculate total expenses (CASH_OUT entries) - use date field to match actual expense occurrence
  const expensesData = await prisma.expense.aggregate({
    where: {
      pgId: { in: pgIds },
      entryType: 'CASH_OUT',
      date: { gte: startDate, lte: endDate }
    },
    _sum: { amount: true }
  });
  const totalExpenses = expensesData._sum.amount || 0;

  // Calculate net profit
  const netProfit = rentCollected - totalExpenses;

  return {
    newMembers,
    rentCollected,
    memberDepartures,
    totalExpenses,
    netProfit
  };
};

/**
 * Calculate trend percentages by comparing current and previous period data
 */
const calculateTrendPercentages = (
  current: Omit<ReportCardsData, 'newMembersTrendPercent' | 'rentCollectedTrendPercent' | 'memberDeparturesTrendPercent' | 'totalExpensesTrendPercent' | 'netProfitTrendPercent'>,
  previous: Omit<ReportCardsData, 'newMembersTrendPercent' | 'rentCollectedTrendPercent' | 'memberDeparturesTrendPercent' | 'totalExpensesTrendPercent' | 'netProfitTrendPercent'>
): ReportCardsData => {
  
  const calculatePercentChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    ...current,
    newMembersTrendPercent: Math.round(calculatePercentChange(current.newMembers, previous.newMembers) * 100) / 100,
    rentCollectedTrendPercent: Math.round(calculatePercentChange(current.rentCollected, previous.rentCollected) * 100) / 100,
    memberDeparturesTrendPercent: Math.round(calculatePercentChange(current.memberDepartures, previous.memberDepartures) * 100) / 100,
    totalExpensesTrendPercent: Math.round(calculatePercentChange(current.totalExpenses, previous.totalExpenses) * 100) / 100,
    netProfitTrendPercent: Math.round(calculatePercentChange(current.netProfit, previous.netProfit) * 100) / 100
  };
};

/**
 * Get period date range based on report type and period
 */
const getPeriodDateRange = (reportType: ReportType, period: number, year: number): { periodStart: Date; periodEnd: Date } => {
  if (reportType === 'WEEKLY') {
    return getWeekDateRange(period, year);
  } else {
    return getMonthDateRange(period, year);
  }
};

/**
 * Get week date range for a specific week number in a year
 */
const getWeekDateRange = (weekNumber: number, year: number): { periodStart: Date; periodEnd: Date } => {
  const firstDayOfYear = new Date(year, 0, 1);
  const daysToFirstWeek = (7 - firstDayOfYear.getDay()) % 7;
  
  const periodStart = new Date(firstDayOfYear);
  periodStart.setDate(firstDayOfYear.getDate() + daysToFirstWeek + (weekNumber - 1) * 7);
  
  const periodEnd = new Date(periodStart);
  periodEnd.setDate(periodStart.getDate() + 6);
  periodEnd.setHours(23, 59, 59, 999);
  
  return { periodStart, periodEnd };
};

/**
 * Get month date range for a specific month in a year
 */
const getMonthDateRange = (month: number, year: number): { periodStart: Date; periodEnd: Date } => {
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);
  
  return { periodStart, periodEnd };
};

/**
 * Get previous period dates for trend comparison
 */
const getPreviousPeriodDates = (
  reportType: ReportType,
  period: number,
  year: number,
  currentStart: Date,
  currentEnd: Date
): { prevPeriodStart: Date; prevPeriodEnd: Date } => {
  
  if (reportType === 'WEEKLY') {
    let prevWeek = period - 1;
    let prevYear = year;
    
    if (prevWeek < 1) {
      prevWeek = 52; // Approximate last week of previous year
      prevYear = year - 1;
    }
    
    const { periodStart, periodEnd } = getWeekDateRange(prevWeek, prevYear);
    return { prevPeriodStart: periodStart, prevPeriodEnd: periodEnd };
  } else {
    let prevMonth = period - 1;
    let prevYear = year;
    
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear = year - 1;
    }
    
    const { periodStart, periodEnd } = getMonthDateRange(prevMonth, prevYear);
    return { prevPeriodStart: periodStart, prevPeriodEnd: periodEnd };
  }
};

/**
 * Check if the given period is the current period
 */
const checkIfCurrentPeriod = (reportType: ReportType, period: number, year: number): boolean => {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  if (year !== currentYear) {
    return year === currentYear;
  }
  
  if (reportType === 'WEEKLY') {
    const currentWeek = getWeekNumber(now);
    return period === currentWeek;
  } else {
    const currentMonth = now.getMonth() + 1;
    return period === currentMonth;
  }
};

/**
 * Get week number for a given date
 */
const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

/**
 * Get cached report data from database
 */
const getCachedReportData = async (
  pgType: PgType,
  reportType: ReportType,
  period: number,
  year: number
): Promise<any | null> => {
  try {
    return await prisma.report.findUnique({
      where: {
        pgType_reportType_period_year: {
          pgType,
          reportType,
          period,
          year
        }
      }
    });
  } catch (error) {
    console.error('Error getting cached report data:', error);
    return null;
  }
};


const formatCachedDataToCompleteReport = (cachedData: any): CompleteReportData => {
  return {
    cards: {
      newMembers: cachedData.newMembers,
      newMembersTrendPercent: cachedData.newMembersTrendPercent,
      rentCollected: cachedData.rentCollected,
      rentCollectedTrendPercent: cachedData.rentCollectedTrendPercent,
      memberDepartures: cachedData.memberDepartures,
      memberDeparturesTrendPercent: cachedData.memberDeparturesTrendPercent,
      totalExpenses: cachedData.totalExpenses,
      totalExpensesTrendPercent: cachedData.totalExpensesTrendPercent,
      netProfit: cachedData.netProfit,
      netProfitTrendPercent: cachedData.netProfitTrendPercent
    },
    tables: {
      pgPerformanceData: JSON.parse(cachedData.pgPerformanceData),
      roomUtilizationData: JSON.parse(cachedData.roomUtilizationData),
      paymentAnalyticsData: JSON.parse(cachedData.paymentAnalyticsData),
      financialSummaryData: JSON.parse(cachedData.financialSummaryData)
    }
  };
};


export const getWeeklyPGPerformanceData = async (
  pgType: PgType,
  weekNumber: number,
  year: number
): Promise<PGPerformanceData[]> => {
  try {
    const { periodStart, periodEnd } = getWeekDateRange(weekNumber, year);
    const isCurrentWeek = checkIfCurrentPeriod('WEEKLY', weekNumber, year);

    // For past weeks, try to get cached data first
    if (!isCurrentWeek) {
      const cachedReport = await getCachedReportData(pgType, 'WEEKLY', weekNumber, year);
      if (cachedReport && cachedReport.pgPerformanceData) {
        return JSON.parse(cachedReport.pgPerformanceData);
      }
    }

    // Get filtered PG IDs based on pgType
    const pgs = await prisma.pG.findMany({
      where: { type: pgType },
      select: { id: true }
    });
    
    const pgIds = pgs.map(pg => pg.id);
    
    if (pgIds.length === 0) {
      return [];
    }

    // Calculate live PG performance data
    return await calculatePGPerformance(prisma, pgIds, periodStart, periodEnd);

  } catch (error) {
    console.error('Error getting weekly PG performance data:', error);
    throw error;
  }
};

/**
 * Get weekly room utilization data - checks cache for past weeks, computes live data for current week
 */
export const getWeeklyRoomUtilizationData = async (
  pgType: PgType,
  weekNumber: number,
  year: number
): Promise<RoomUtilizationData[]> => {
  try {
    const { periodStart, periodEnd } = getWeekDateRange(weekNumber, year);
    const isCurrentWeek = checkIfCurrentPeriod('WEEKLY', weekNumber, year);

    // For past weeks, try to get cached data first
    if (!isCurrentWeek) {
      const cachedReport = await getCachedReportData(pgType, 'WEEKLY', weekNumber, year);
      if (cachedReport && cachedReport.roomUtilizationData) {
        return JSON.parse(cachedReport.roomUtilizationData);
      }
    }

    // Get filtered PG IDs based on pgType
    const pgs = await prisma.pG.findMany({
      where: { type: pgType },
      select: { id: true }
    });
    
    const pgIds = pgs.map(pg => pg.id);
    
    if (pgIds.length === 0) {
      return [];
    }

    // Calculate live room utilization data
    return await calculateRoomUtilization(prisma, pgIds, periodStart, periodEnd);

  } catch (error) {
    console.error('Error getting weekly room utilization data:', error);
    throw error;
  }
};

/**
 * Get weekly payment analytics data - checks cache for past weeks, computes live data for current week
 */
export const getWeeklyPaymentAnalyticsData = async (
  pgType: PgType,
  weekNumber: number,
  year: number
): Promise<PaymentAnalyticsData[]> => {
  try {
    const { periodStart, periodEnd } = getWeekDateRange(weekNumber, year);
    const isCurrentWeek = checkIfCurrentPeriod('WEEKLY', weekNumber, year);

    // For past weeks, try to get cached data first
    if (!isCurrentWeek) {
      const cachedReport = await getCachedReportData(pgType, 'WEEKLY', weekNumber, year);
      if (cachedReport && cachedReport.paymentAnalyticsData) {
        return JSON.parse(cachedReport.paymentAnalyticsData);
      }
    }

    // Get filtered PG IDs based on pgType
    const pgs = await prisma.pG.findMany({
      where: { type: pgType },
      select: { id: true }
    });
    
    const pgIds = pgs.map(pg => pg.id);
    
    if (pgIds.length === 0) {
      return [];
    }

    // Calculate live payment analytics data
    return await calculatePaymentAnalytics(prisma, pgIds, periodStart, periodEnd);

  } catch (error) {
    console.error('Error getting weekly payment analytics data:', error);
    throw error;
  }
};

/**
 * Get weekly financial summary data - checks cache for past weeks, computes live data for current week
 */
export const getWeeklyFinancialSummaryData = async (
  pgType: PgType,
  weekNumber: number,
  year: number
): Promise<FinancialSummaryData[]> => {
  try {
    const { periodStart, periodEnd } = getWeekDateRange(weekNumber, year);
    const isCurrentWeek = checkIfCurrentPeriod('WEEKLY', weekNumber, year);

    // For past weeks, try to get cached data first
    if (!isCurrentWeek) {
      const cachedReport = await getCachedReportData(pgType, 'WEEKLY', weekNumber, year);
      if (cachedReport && cachedReport.financialSummaryData) {
        return JSON.parse(cachedReport.financialSummaryData);
      }
    }

    // Get filtered PG IDs based on pgType
    const pgs = await prisma.pG.findMany({
      where: { type: pgType },
      select: { id: true }
    });
    
    const pgIds = pgs.map(pg => pg.id);
    
    if (pgIds.length === 0) {
      return [];
    }

    // Calculate live financial summary data
    return await calculateFinancialSummary(prisma, pgIds, periodStart, periodEnd);

  } catch (error) {
    console.error('Error getting weekly financial summary data:', error);
    throw error;
  }
};


export const getMonthlyPGPerformanceData = async (
  pgType: PgType,
  month: number,
  year: number
): Promise<PGPerformanceData[]> => {
  try {
    const { periodStart, periodEnd } = getMonthDateRange(month, year);
    const isCurrentMonth = checkIfCurrentPeriod('MONTHLY', month, year);

    // For past months, try to get cached data first
    if (!isCurrentMonth) {
      const cachedReport = await getCachedReportData(pgType, 'MONTHLY', month, year);
      if (cachedReport && cachedReport.pgPerformanceData) {
        return JSON.parse(cachedReport.pgPerformanceData);
      }
    }

    // Get filtered PG IDs based on pgType
    const pgs = await prisma.pG.findMany({
      where: { type: pgType },
      select: { id: true }
    });
    
    const pgIds = pgs.map(pg => pg.id);
    
    if (pgIds.length === 0) {
      return [];
    }

    // Calculate live PG performance data
    return await calculatePGPerformance(prisma, pgIds, periodStart, periodEnd);

  } catch (error) {
    console.error('Error getting monthly PG performance data:', error);
    throw error;
  }
};

/**
 * Get monthly room utilization data - checks cache for past months, computes live data for current month
 */
export const getMonthlyRoomUtilizationData = async (
  pgType: PgType,
  month: number,
  year: number
): Promise<RoomUtilizationData[]> => {
  try {
    const { periodStart, periodEnd } = getMonthDateRange(month, year);
    const isCurrentMonth = checkIfCurrentPeriod('MONTHLY', month, year);

    // For past months, try to get cached data first
    if (!isCurrentMonth) {
      const cachedReport = await getCachedReportData(pgType, 'MONTHLY', month, year);
      if (cachedReport && cachedReport.roomUtilizationData) {
        return JSON.parse(cachedReport.roomUtilizationData);
      }
    }

    // Get filtered PG IDs based on pgType
    const pgs = await prisma.pG.findMany({
      where: { type: pgType },
      select: { id: true }
    });
    
    const pgIds = pgs.map(pg => pg.id);
    
    if (pgIds.length === 0) {
      return [];
    }

    // Calculate live room utilization data
    return await calculateRoomUtilization(prisma, pgIds, periodStart, periodEnd);

  } catch (error) {
    console.error('Error getting monthly room utilization data:', error);
    throw error;
  }
};

/**
 * Get monthly payment analytics data - checks cache for past months, computes live data for current month
 */
export const getMonthlyPaymentAnalyticsData = async (
  pgType: PgType,
  month: number,
  year: number
): Promise<PaymentAnalyticsData[]> => {
  try {
    const { periodStart, periodEnd } = getMonthDateRange(month, year);
    const isCurrentMonth = checkIfCurrentPeriod('MONTHLY', month, year);

    // For past months, try to get cached data first
    if (!isCurrentMonth) {
      const cachedReport = await getCachedReportData(pgType, 'MONTHLY', month, year);
      if (cachedReport && cachedReport.paymentAnalyticsData) {
        return JSON.parse(cachedReport.paymentAnalyticsData);
      }
    }

    // Get filtered PG IDs based on pgType
    const pgs = await prisma.pG.findMany({
      where: { type: pgType },
      select: { id: true }
    });
    
    const pgIds = pgs.map(pg => pg.id);
    
    if (pgIds.length === 0) {
      return [];
    }

    // Calculate live payment analytics data
    return await calculatePaymentAnalytics(prisma, pgIds, periodStart, periodEnd);

  } catch (error) {
    console.error('Error getting monthly payment analytics data:', error);
    throw error;
  }
};

/**
 * Get monthly financial summary data - checks cache for past months, computes live data for current month
 */
export const getMonthlyFinancialSummaryData = async (
  pgType: PgType,
  month: number,
  year: number
): Promise<FinancialSummaryData[]> => {
  try {
    const { periodStart, periodEnd } = getMonthDateRange(month, year);
    const isCurrentMonth = checkIfCurrentPeriod('MONTHLY', month, year);

    // For past months, try to get cached data first
    if (!isCurrentMonth) {
      const cachedReport = await getCachedReportData(pgType, 'MONTHLY', month, year);
      if (cachedReport && cachedReport.financialSummaryData) {
        return JSON.parse(cachedReport.financialSummaryData);
      }
    }

    // Get filtered PG IDs based on pgType
    const pgs = await prisma.pG.findMany({
      where: { type: pgType },
      select: { id: true }
    });
    
    const pgIds = pgs.map(pg => pg.id);
    
    if (pgIds.length === 0) {
      return [];
    }

    // Calculate live financial summary data
    return await calculateFinancialSummary(prisma, pgIds, periodStart, periodEnd);

  } catch (error) {
    console.error('Error getting monthly financial summary data:', error);
    throw error;
  }
};
