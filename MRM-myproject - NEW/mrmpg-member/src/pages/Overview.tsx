import React, { useState, useEffect, useCallback } from "react";
import { Button } from "../components/Button";
import { StatusBadge } from "../components/StatusBadge";
import { RentCard } from "../components/RentCard";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../navigation/Navigation";

// --- Configuration ---
const HISTORY_LIMIT = 10;

// --- Type Definitions ---
interface PaymentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface BackendPaymentItem {
  id: string;
  amount: number;
  month: number;
  year: number;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "OVERDUE";
  paidDate: string | null;
  dueDate: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED"; // Fixed type
  attemptNumber: number;
  overdueDate: string | null;
  approvedAt: string | null;
}

interface HistoryResponse {
  payments: BackendPaymentItem[];
  pagination: PaymentPagination;
}

interface HistoryItem {
  monthYear: string;
  type: string;
  amount: number;
  paymentDate: string | null;
  status: "PENDING" | "PAID" | "FAILED" | "OVERDUE";
  isCurrent?: boolean;
  approvalStatus?: string; // Added missing property
  attemptNumber?: number; // Added missing property
  dueDate?: string; // Added missing property
  overdueDate?: string | null; // Added missing property
  approvedAt?: string | null; // Added missing property
}

interface PaymentInfo {
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "OVERDUE";
  dueDate: string;
  paidDate: string | null;
  rentAmount: number;
  electricityAmount: number;
  totalAmount: number;
}

interface BillingInfo {
  rentAmount: number;
  electricityBillAmount: number;
  unitsUsed: number;
  totalAmount: number;
  description?: string;
}

interface OverviewData {
  currentMonth: {
    month: number;
    year: number;
    monthName: string;
  };
  billing: BillingInfo;
  paymentInfo: PaymentInfo | null;
  dueDate: string;
  isOverdue: boolean;
}

// --- Utility Functions ---
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  });
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "---";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatMonthYear = (month: number, year: number): string => {
  const date = new Date(year, month - 1);
  return date.toLocaleDateString("default", { month: "short", year: "numeric" });
};

export const Overview: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
const overviewFetchedRef = React.useRef(false);
const historyFetchedPageRef = React.useRef<number | null>(null);

  // --- Fetch Overview Data ---
  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/user/current-month-overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setOverview(response.data.data);
      } else {
        setError(response.data.message || "Failed to fetch overview data.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load current month overview.");
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Fetch History Data ---
  const fetchHistory = useCallback(async (page: number) => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/user/payments/history?page=${page}&limit=${HISTORY_LIMIT}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (err: any) {
      console.error("History API Error:", err);
      // Optionally set error for history
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // --- Effects ---
useEffect(() => {
  if (overviewFetchedRef.current) return;

  overviewFetchedRef.current = true;
  fetchOverview();
}, [fetchOverview]);


useEffect(() => {
  if (historyFetchedPageRef.current === currentPage) return;

  historyFetchedPageRef.current = currentPage;
  fetchHistory(currentPage);
}, [currentPage, fetchHistory]);

  // --- Handlers ---
  const handlePageChange = (newPage: number) => {
    if (history && newPage >= 1 && newPage <= history.pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  // --- Data Processing for Display ---
  if (loading) {
    return <div className="p-8 text-center text-lg text-gray-600">Loading initial data...</div>;
  }

  if (error || !overview) {
    return (
      <div className="p-8 text-center text-red-600 text-lg">
        Error: {error || "No overview data available."}
      </div>
    );
  }

  const { currentMonth, billing, paymentInfo, isOverdue } = overview;

  const currentMonthStatus: "PENDING" | "PAID" | "OVERDUE" | "FAILED" = paymentInfo
    ? paymentInfo.paymentStatus === "PAID"
      ? "PAID"
      : isOverdue
      ? "OVERDUE"
      : paymentInfo.paymentStatus
    : "PENDING";

  const totalRent = billing.rentAmount;
  const totalElectricity = billing.electricityBillAmount;
  const totalBill = billing.totalAmount;
  const isActionable = currentMonthStatus === "PENDING" || currentMonthStatus === "OVERDUE";
  
  // Map backend payment items to frontend HistoryItem
  const mappedHistory: HistoryItem[] = history
    ? history.payments.map((p) => ({
        monthYear: formatMonthYear(p.month, p.year),
        type: "Rent & Electricity",
        amount: p.amount,
        paymentDate: p.paidDate,
        status: p.paymentStatus,
        approvalStatus: p.approvalStatus,
        attemptNumber: p.attemptNumber,
        dueDate: p.dueDate,
        overdueDate: p.overdueDate,
        approvedAt: p.approvedAt,
      }))
    : [];

  // Check if current month is in fetched history
  const isCurrentMonthInHistory = mappedHistory.some(
    (item) =>
      item.monthYear.includes(currentMonth.monthName.slice(0, 3)) &&
      item.monthYear.includes(currentMonth.year.toString())
  );

  let displayHistory: HistoryItem[] = mappedHistory;

  // Prepend current month's bill only on first page if not in history
  if (currentPage === 1 && !isCurrentMonthInHistory && paymentInfo) {
    const currentBillItem: HistoryItem = {
      monthYear: `${currentMonth.monthName} ${currentMonth.year}`,
      type: "Rent & Electricity",
      amount: totalBill,
      paymentDate: paymentInfo.paidDate,
      status: currentMonthStatus,
      isCurrent: true,
    };
    displayHistory = [currentBillItem, ...mappedHistory];
  }

  // --- Pagination Renderer ---
  const renderPagination = () => {
    if (!history || history.pagination.totalPages <= 1) return null;

    const { totalPages } = history.pagination;
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

    return (
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          className="px-3 py-1 border rounded text-xs sm:text-sm disabled:opacity-50"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ← Prev
        </button>

        {startPage > 1 && (
          <button
            className="w-7 h-7 sm:w-10 sm:h-10 border text-xs rounded"
            onClick={() => handlePageChange(1)}
          >
            1
          </button>
        )}
        {startPage > 2 && <button className="w-7 h-7 sm:w-10 sm:h-10 border text-xs rounded">…</button>}

        {pages.map((num) => (
          <button
            key={num}
            className={`w-7 h-7 sm:w-10 sm:h-10 text-xs rounded ${
              num === currentPage
                ? "bg-red-500 text-white"
                : "border border-gray-300 text-gray-600"
            }`}
            onClick={() => handlePageChange(num)}
          >
            {num}
          </button>
        ))}

        {endPage < totalPages - 1 && (
          <button className="w-7 h-7 sm:w-10 sm:h-10 border text-xs rounded">…</button>
        )}
        {endPage < totalPages && (
          <button
            className="w-7 h-7 sm:w-10 sm:h-10 border text-xs rounded"
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </button>
        )}

        <button
          className="px-3 py-1 border rounded text-xs sm:text-sm disabled:opacity-50"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next →
        </button>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen w-full px-3 sm:px-6 lg:px-10 py-3 sm:py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-lg sm:text-3xl font-bold text-gray-900 leading-tight">
            {currentMonth.monthName} {currentMonth.year} Overview
          </h1>
          <p className="text-xs sm:text-base text-gray-500 mt-1">
            Track your rent, bills, and payment status.
          </p>
        </div>

        {/* Current Bills Section */}
        <div className="mb-6 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-6">
            <h2 className="text-base sm:text-2xl font-semibold text-gray-900">Current Bills</h2>

            {isActionable && (
              <Button
                title={`Pay ${formatCurrency(totalBill)}`}
                width="160px"
                height="45px"
                backgroundColor="#FF2E2E"
                borderRadius="8px"
                onPress={() => navigate("/upload-proof")}
                icon={null}
              />
            )}
          </div>

          {/* Rent Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <RentCard
              heading={`${currentMonth.monthName} Rent`}
              price={formatCurrency(totalRent)}
              dueDate={`${overview?.dueDate || null}`}
              description="Includes base rent, maintenance, and common charges."
              status={currentMonthStatus}
            />
            <RentCard
              heading={`Electricity Bill - ${currentMonth.monthName}`}
              price={formatCurrency(totalElectricity)}
              dueDate={`${overview?.dueDate || null}`}
              description={`Total Units Consumed: ${billing.unitsUsed} Units`}
              status={currentMonthStatus}
            />
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div className="p-3 sm:p-6 border-b">
            <h3 className="text-base sm:text-2xl font-semibold text-gray-900">Payment History</h3>
          </div>

          {historyLoading && <div className="p-4 text-center text-gray-500">Loading history...</div>}

          {/* Desktop Table */}
          {!historyLoading && displayHistory.length > 0 && (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Month", "Type", "Amount", "Payment Date", "Status"].map((item) => (
                        <th
                          key={item}
                          className="py-3 px-4 text-sm font-medium text-gray-600 uppercase text-left"
                        >
                          {item}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {displayHistory.map((item, idx) => (
                      <tr
                        key={idx}
                        className={
                          item.isCurrent
                            ? "bg-yellow-50 hover:bg-yellow-100 transition"
                            : "hover:bg-gray-50 transition"
                        }
                      >
                        <td className="py-4 px-6 font-medium text-gray-900">{item.monthYear}</td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              item.type.includes("Electricity")
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-semibold">{formatCurrency(item.amount)}</td>
                        <td className="py-4 px-6">{formatDate(item.paymentDate)}</td>
                        <td className="py-4 px-6">
                          <StatusBadge title={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden">
                {displayHistory.map((item, idx) => (
                  <div key={idx} className="p-3 sm:p-6 border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm sm:text-lg font-semibold">{item.monthYear}</h4>
                        <span
                          className={`inline-block mt-1 px-2 py-1 text-[10px] sm:text-xs rounded-full ${
                            item.type.includes("Electricity")
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {item.type}
                        </span>
                      </div>
                      <StatusBadge title={item.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 my-3">
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500">Amount</p>
                        <p className="font-semibold text-sm sm:text-base">
                          {formatCurrency(item.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500">Payment Date</p>
                        <p className="text-sm sm:text-base">{formatDate(item.paymentDate)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* No History Message */}
          {!historyLoading && displayHistory.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No payment history found.
            </div>
          )}

          {/* Pagination */}
          <div className="p-3 sm:p-6 border-t">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs sm:text-sm text-gray-500">
                {history
                  ? `Showing ${(history.pagination.page - 1) * history.pagination.limit + 1}-${Math.min(
                      history.pagination.page * history.pagination.limit,
                      history.pagination.total
                    )} of ${history.pagination.total} payments`
                  : "Loading payments..."}
              </p>
              {renderPagination()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;