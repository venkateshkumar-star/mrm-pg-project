import layouts from "@/components/layouts";
import ui from "@/components/ui";
import { ApiClient, AuthManager } from "@/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotification } from "@/hooks/useNotification";
import type { types } from "@/types";
import type {
    CardItem,
    ReportsPageCardsResponse,
    PgReportData,
    RoomReportData,
    PaymentReportData,
    FinancialReportData,
    PgReportResponse,
    RoomReportResponse,
    PaymentReportResponse,
    FinancialReportResponse
} from "@/types/apiResponseTypes";
import type { WeekRange } from "@/components/ui/WeekPicker";
import type { MonthRange } from "@/components/ui/MonthPicker";
import "./ReportsPage.scss";

const ReportsPage = (): React.ReactElement => {

    const isInitialLoad = useRef(true);
    const navigate = useNavigate();
    const notification = useNotification();
    const { search } = useLocation();
    const params = useMemo(() => new URLSearchParams(search), [search]);
    const reportType = params.get('type') || 'weekly';

    // Helper function to get current week
    const getCurrentWeek = useCallback((): WeekRange => {
        const today = new Date();
        const startOfWeek = new Date(today);
        const dayOfWeek = today.getDay();
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Calculate correct week number for the year
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
        const pastDaysOfYear = (today.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

        return {
            start: startOfWeek,
            end: endOfWeek,
            weekNumber,
            year: today.getFullYear()
        };
    }, []);

    // Helper function to get current month
    const getCurrentMonth = useCallback((): MonthRange => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();

        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        return {
            month,
            year,
            startDate,
            endDate,
            displayName: `${monthNames[month]} ${year}`
        };
    }, []);

    const [activeTab, setActiveTab] = useState<string>("pg-report");
    const [selectedWeek, setSelectedWeek] = useState<WeekRange | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<MonthRange | null>(null);

    // cards response
    const [cardData, setCardData] = useState<CardItem[]>([
        { icon: "alertTriangle" }, { icon: "alertTriangle" }, { icon: "alertTriangle" }, { icon: "alertTriangle" }
    ]);
    const [cardsResponse, setCardsResponse] = useState<ReportsPageCardsResponse | null>(null);

    // table data state
    const [tableData, setTableData] = useState<(PgReportData | RoomReportData | PaymentReportData | FinancialReportData)[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Loading states
    const [cardsLoading, setCardsLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);

    // Pagination state
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1
    });

    // Authentication token validation
    useEffect(() => {
        const checkTokenValidity = () => {
            if (!AuthManager.isTokenValid()) {
                AuthManager.clearAuthData();
                navigate('/login');
            }
        };
        checkTokenValidity();
    }, [navigate]);

    // fetch reports page stats card
    const fetchReportsStatsCard = useCallback(async () => {
        setCardsLoading(true);
        try {
            let queryParams = '';

            // For weekly reports
            if (reportType === 'weekly') {
                const weekToUse = selectedWeek || getCurrentWeek();
                queryParams = `?weekNumber=${weekToUse.weekNumber}&year=${weekToUse.year}`;
            }

            // For monthly reports
            if (reportType === 'monthly') {
                const monthToUse = selectedMonth || getCurrentMonth();
                queryParams = `?month=${monthToUse.month + 1}&year=${monthToUse.year}`;
            }

            const apiResponse = await ApiClient.get(`/stats/reports/${reportType}${queryParams}`) as ReportsPageCardsResponse;
            if (apiResponse.success && apiResponse.data) {
                setCardsResponse(apiResponse);
                setCardData(apiResponse.data.cards);
            }
            else {
                notification.showError(apiResponse.error || "Failed to fetch reports stats", apiResponse.message, 5000);
            }
        } catch (error) {
            notification.showError("Failed to fetch reports stats", error instanceof Error ? error.message : String(error), 5000);
        } finally {
            setCardsLoading(false);
        }
    }, [reportType, selectedWeek, selectedMonth, notification, getCurrentWeek, getCurrentMonth]);

    // Fetch table data based on active tab
    const fetchTableData = useCallback(async (resetPage = false, pageOverride?: number) => {
        setTableLoading(true);
        const page = resetPage ? 1 : (pageOverride ?? currentPage);

        try {
            let queryParams = `page=${page}&limit=10`;

            // For weekly reports
            if (reportType === 'weekly') {
                const weekToUse = selectedWeek || getCurrentWeek();
                queryParams += `&weekNumber=${weekToUse.weekNumber}&year=${weekToUse.year}`;
            }

            // For monthly reports
            if (reportType === 'monthly') {
                const monthToUse = selectedMonth || getCurrentMonth();
                queryParams += `&month=${monthToUse.month + 1}&year=${monthToUse.year}`;
            }

            let apiResponse: PgReportResponse | RoomReportResponse | PaymentReportResponse | FinancialReportResponse;
            switch (activeTab) {
                case "pg-report":
                    apiResponse = await ApiClient.get(`/report/${activeTab}?${queryParams}`) as PgReportResponse;
                    break;
                case "room-report":
                    apiResponse = await ApiClient.get(`/report/${activeTab}?${queryParams}`) as RoomReportResponse;
                    break;
                case "payment-report":
                    apiResponse = await ApiClient.get(`/report/${activeTab}?${queryParams}`) as PaymentReportResponse;
                    break;
                case "financial-report":
                    apiResponse = await ApiClient.get(`/report/${activeTab}?${queryParams}`) as FinancialReportResponse;
                    break;
                default:
                    throw new Error("Invalid tab");
            }

            if (apiResponse.success && apiResponse.data) {
                setTableData(apiResponse.data.tableData || []);
                setPagination(apiResponse.data.pagination || {
                    page: 1,
                    limit: 10,
                    total: 0,
                    totalPages: 1
                });
                if (resetPage) {
                    setCurrentPage(1);
                }
            } else {
                notification.showError(apiResponse.error || "Failed to fetch table data", apiResponse.message, 5000);
                // Reset data on error
                setTableData([]);
                setPagination({
                    page: 1,
                    limit: 10,
                    total: 0,
                    totalPages: 1
                });
            }
        } catch (error) {
            notification.showError("Failed to fetch table data", error instanceof Error ? error.message : String(error), 5000);
            // Reset data on error
            setTableData([]);
            setPagination({
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 1
            });
        } finally {
            setTableLoading(false);
        }
    }, [activeTab, currentPage, selectedWeek, selectedMonth, reportType, notification, getCurrentWeek, getCurrentMonth]);

    // Handle pagination
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // Pass the page directly to fetchTableData to avoid stale state
        fetchTableData(false, page);
    };

    // Handle sorting
    const handleSort = (key: string, direction: 'asc' | 'desc') => {
        setSortKey(key);
        setSortDirection(direction);
    };

    // Handle refresh
    const handleRefresh = useCallback(() => {
        fetchTableData();
        fetchReportsStatsCard();
    }, [fetchTableData, fetchReportsStatsCard]);

    // Get table columns based on active tab
    const getTableColumns = (): types["TableColumn"][] => {
        switch (activeTab) {
            case "pg-report":
                return [
                    { key: "pgName", label: "PG Name", sortable: false },
                    { key: "pgLocation", label: "Location", sortable: false },
                    { key: "pgType", label: "Type", align: "center", sortable: false },
                    { key: "totalMembers", label: "Total Members", align: "center", sortable: false },
                    { key: "newMembersThisWeek", label: "New Members", align: "center", sortable: false },
                    { key: "totalRooms", label: "Total Rooms", align: "center", sortable: false },
                    { key: "occupiedRooms", label: "Occupied", align: "center", sortable: false },
                    { key: "vacantRooms", label: "Vacant", align: "center", sortable: false },
                    { key: "occupancyRate", label: "Occupancy %", align: "center", render: (value) => `${value}%`, sortable: false },
                    { key: "weeklyRevenue", label: "Weekly Revenue", align: "right", render: (value) => `₹${value}`, sortable: false },
                    { key: "pendingPayments", label: "Pending Payments", align: "center", sortable: false },
                    { key: "overduePayments", label: "Overdue Payments", align: "center", sortable: false },
                    { key: "totalExpenses", label: "Total Expenses", align: "right", render: (value) => `₹${value}`, sortable: false },
                    { key: "totalElectricityCharges", label: "Electricity Charges", align: "right", render: (value) => `₹${value}`, sortable: false },
                    { key: "pendingLeavingRequests", label: "Pending Leaving", align: "center", sortable: false },
                    { key: "approvedLeavingRequests", label: "Approved Leaving", align: "center", sortable: false },
                    { key: "netRevenue", label: "Net Revenue", align: "right", render: (value) => `₹${value}`, sortable: false },
                    { key: "avgRentPerRoom", label: "Avg Rent/Room", align: "right", render: (value) => `₹${value}`, sortable: false }
                ];

            case "room-report":
                return [
                    { key: "pgName", label: "PG Name", sortable: false },
                    { key: "pgLocation", label: "Location", sortable: false },
                    { key: "roomNo", label: "Room No", sortable: false },
                    { key: "capacity", label: "Capacity", align: "center", sortable: false },
                    { key: "currentOccupants", label: "Current Occupants", align: "center", sortable: false },
                    { key: "availableSlots", label: "Available Slots", align: "center", sortable: false },
                    { key: "utilizationRate", label: "Utilization %", align: "center", render: (value) => `${Number(value).toFixed(1)}%`, sortable: false },
                    { key: "totalAmount", label: "Total Amount", align: "right", render: (value) => `₹${value}`, sortable: false },
                    { key: "electricityCharge", label: "Electricity Charge", align: "right", render: (value) => `₹${value}`, sortable: false },
                    { key: "weeklyRevenue", label: "Weekly Revenue", align: "right", render: (value) => `₹${value}`, sortable: false },
                    { key: "totalMonthlyEarnings", label: "Monthly Earnings", align: "right", render: (value) => `₹${value}`, sortable: false },
                    { key: "revenuePerOccupant", label: "Revenue/Occupant", align: "right", render: (value) => `₹${value}`, sortable: false },
                    { key: "electricityPerOccupant", label: "Electricity/Occupant", align: "right", render: (value) => `₹${value}`, sortable: false },
                    { key: "revenueEfficiency", label: "Revenue Efficiency", align: "center", sortable: false }
                ];

            case "payment-report":
                return [
                    { key: "pgName", label: "PG Name", sortable: false },
                    { key: "pgLocation", label: "Location", sortable: false },
                    { key: "totalMembers", label: "Total Members", align: "center", sortable: false },
                    { key: "paymentsReceived", label: "Received", align: "center", sortable: false },
                    { key: "paymentsApproved", label: "Approved", align: "center", sortable: false },
                    { key: "paymentsPending", label: "Pending", align: "center", sortable: false },
                    { key: "paymentsOverdue", label: "Overdue", align: "center", sortable: false },
                    { key: "totalAmountReceived", label: "Amount Received", align: "right", render: (value) => `₹${value}`, sortable: false },
                    { key: "totalAmountApproved", label: "Amount Approved", align: "right", render: (value) => `₹${value}`, sortable: false },
                    { key: "totalAmountPending", label: "Amount Pending", align: "right", render: (value) => `₹${value}`, sortable: false },
                    { key: "totalAmountOverdue", label: "Amount Overdue", align: "right", render: (value) => `₹${value}`, sortable: false },
                    { key: "avgPaymentAmount", label: "Avg Payment", align: "right", render: (value) => `₹${value}`, sortable: false },
                    { key: "totalExpectedRevenue", label: "Expected Revenue", align: "right", render: (value) => `₹${value}`, sortable: false },
                    { key: "shortfallAmount", label: "Shortfall Amount", align: "right", render: (value) => `₹${value}`, sortable: false },
                    { key: "collectionEfficiency", label: "Collection %", align: "center", render: (value) => `${value}%`, sortable: false },
                ];

            case "financial-report":
                return [
                    { key: "pgName", label: "PG Name", sortable: false },
                    { key: "pgLocation", label: "Location", sortable: false },
                    { key: "expectedRevenue", label: "Expected Revenue", align: "right", render: (value) => `₹${value}`, sortable: false },
                    { key: "actualRevenue", label: "Actual Revenue", align: "right", render: (value) => `₹${value}`, sortable: false },
                    { key: "pendingRevenue", label: "Pending Revenue", align: "right", render: (value) => `₹${value}`, sortable: false },
                    { key: "overdueRevenue", label: "Overdue Revenue", align: "right", render: (value) => `₹${value}`, sortable: false },
                    { key: "advanceCollected", label: "Advance Collected", align: "right", render: (value) => `₹${value}`, sortable: false },
                    { key: "totalCashInflow", label: "Total Cash Inflow", align: "right", render: (value) => `₹${value}`, sortable: false },
                    { key: "revenueVariance", label: "Revenue Variance", align: "right", render: (value) => `₹${value}`, sortable: false },
                    {
                        key: "cashFlowStatus",
                        label: "Cash Flow Status",
                        align: "center",
                        render: (value) => (
                            <span className={`status-badge ${value === 'Positive' ? 'status-badge--success' : 'status-badge--danger'}`}>
                                {String(value)}
                            </span>
                        ),
                        sortable: false
                    },
                    { key: "collectionTrend", label: "Collection Trend %", align: "center", render: (value) => `${value}%`, sortable: false }
                ];

            default:
                return [];
        }
    };

    // Reports page tabs
    const tabsItem = [
        {
            id: "pg-report",
            label: "PG's Report",
        },
        {
            id: "room-report",
            label: "Room's Report",
        },
        {
            id: "payment-report",
            label: "Payment's Report",
        },
        {
            id: "financial-report",
            label: "Financial Report",
        }
    ]

    // handle tabs changes
    const handleTabChange = useCallback((tabId: string) => {
        setActiveTab(tabId);
        setCurrentPage(1);
        setSortKey(null);
        setSortDirection('asc');
    }, []);

    // Handle week selection
    const handleWeekChange = useCallback((weekRange: WeekRange | null) => {
        console.log("Selected week:", weekRange);
        setSelectedWeek(weekRange);
        if (weekRange) {
            setSelectedMonth(null);
        }
        setCurrentPage(1);
    }, []);

    // Handle month selection
    const handleMonthChange = useCallback((monthRange: MonthRange | null) => {
        setSelectedMonth(monthRange);
        if (monthRange) {
            setSelectedWeek(null);
        }

        setCurrentPage(1);
    }, []);

    const handleDownloadReport = useCallback(async () => {
        setDownloadLoading(true);
        try {
            const downloadUrl = `/report/download/${reportType}`;
            const queryParams = new URLSearchParams();

            // For weekly reports
            if (reportType === 'weekly') {
                const weekToUse = selectedWeek || getCurrentWeek();
                const startDate = weekToUse.start.toISOString().split('T')[0];
                const endDate = weekToUse.end.toISOString().split('T')[0];
                queryParams.append('startDate', startDate);
                queryParams.append('endDate', endDate);
            }

            // For monthly reports
            if (reportType === 'monthly') {
                const monthToUse = selectedMonth || getCurrentMonth();
                queryParams.append('month', String(monthToUse.month + 1));
                queryParams.append('year', String(monthToUse.year));
            }

            const fullUrl = `${downloadUrl}?${queryParams.toString()}`;

            const response = await ApiClient.makeAuthenticatedRequest(fullUrl, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Get the blob from response
            const blob = await response.blob();

            // Create blob URL and trigger download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Generate filename based on current context
            const timestamp = new Date().toISOString().split('T')[0];
            const tabName = activeTab.replace('-', '_');

            // Create a more descriptive filename
            let dateInfo = '';
            if (reportType === 'weekly') {
                const weekToUse = selectedWeek || getCurrentWeek();
                const startDate = weekToUse.start.toISOString().split('T')[0];
                const endDate = weekToUse.end.toISOString().split('T')[0];
                dateInfo = `${startDate}_to_${endDate}`;
            } else if (reportType === 'monthly') {
                const monthToUse = selectedMonth || getCurrentMonth();
                dateInfo = `${monthToUse.year}_${String(monthToUse.month + 1).padStart(2, '0')}`;
            }

            link.download = `${reportType}_${tabName}_report_${dateInfo}_${timestamp}.xlsx`;

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            notification.showSuccess("Report downloaded successfully", `${reportType} ${activeTab.replace('-', ' ')} report has been downloaded`, 3000);
        } catch (error) {
            notification.showError("Failed to download report", error instanceof Error ? error.message : String(error), 5000);
        } finally {
            setDownloadLoading(false);
        }
    }, [reportType, activeTab, selectedWeek, selectedMonth, notification, getCurrentWeek, getCurrentMonth]);

    // Effect to fetch data when reportType changes
    useEffect(() => {
        if (AuthManager.isAuthenticated() && !isInitialLoad.current) {
            setCurrentPage(1);
            setSortKey(null);
            setSortDirection('asc');

            // Fetch new data for the changed report type
            fetchReportsStatsCard();
            fetchTableData(true);
        }
    }, [reportType, fetchReportsStatsCard, fetchTableData]);

    // Effect to fetch data when tab changes
    useEffect(() => {
        if (AuthManager.isAuthenticated() && activeTab && !isInitialLoad.current) {
            fetchTableData(true);
        }
    }, [activeTab, fetchTableData]);

    // Effect to fetch data when selected week changes
    useEffect(() => {
        if (AuthManager.isAuthenticated() && !isInitialLoad.current) {
            fetchReportsStatsCard();
            fetchTableData(true);
        }
    }, [selectedWeek, fetchReportsStatsCard, fetchTableData]);

    // Effect to handle page changes
    useEffect(() => {
        if (AuthManager.isAuthenticated() && currentPage > 1 && !isInitialLoad.current) {
            fetchTableData();
        }
    }, [currentPage, fetchTableData]);

    // Initial data fetch
    useEffect(() => {
        if (AuthManager.isAuthenticated() && isInitialLoad.current) {
            fetchReportsStatsCard();
            fetchTableData();
            isInitialLoad.current = false;
        }
    }, [fetchReportsStatsCard, fetchTableData]);

    // Effect to fetch data when selected month changes
    useEffect(() => {
        if (AuthManager.isAuthenticated() && !isInitialLoad.current) {
            fetchReportsStatsCard();
            fetchTableData(true);
        }
    }, [selectedMonth, fetchReportsStatsCard, fetchTableData]);

    return (
        <div className="reports-page">
            <div className="reports-page__header">
                <layouts.HeaderLayout title={`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Reports`} subText={`View and generate your ${reportType} reports`} />
            </div>
            <div className="reports-page__content">

                <div className="reports-page__date-pickers-section">
                    <div className="reports-page__picker-container">
                        {reportType === 'weekly' && (
                            <div className="reports-page__week-picker">
                                <ui.WeekPicker
                                    value={selectedWeek}
                                    onChange={handleWeekChange}
                                    placeholder="Select a week to filter reports"
                                    size="small"
                                />
                            </div>
                        )}

                        {reportType === 'monthly' && (
                            <div className="reports-page__month-picker">
                                <ui.MonthPicker
                                    value={selectedMonth}
                                    onChange={handleMonthChange}
                                    placeholder="Select a month to filter reports"
                                    size="small"
                                    showQuickSelect={true}
                                    clearable={true}
                                />
                            </div>
                        )}
                    </div>

                    <div className="reports-page__downloadReport-section">
                        <ui.Button
                            onClick={handleDownloadReport}
                            disabled={downloadLoading || tableLoading}
                            leftIcon={downloadLoading ? <ui.Icons name="loader" className="animate-spin" /> : <ui.Icons name="download" />}
                        >
                            {downloadLoading ? "Downloading..." : "Download Report"}
                        </ui.Button>
                    </div>
                </div>

                <div className="reports-page__cards-section">
                    <layouts.CardGrid
                        cards={cardData}
                        loading={cardsLoading}
                        columns={4}
                        showRefresh
                        lastUpdated={cardsResponse?.data.lastUpdated}
                        onRefresh={fetchReportsStatsCard}
                    />
                </div>

                <div className="reports-page__tabs-section">
                    <ui.Tabs tabs={tabsItem} activeTab={activeTab} onTabChange={handleTabChange} />
                </div>

                <div className="reports-page__table-section">
                    <layouts.TableLayout
                        columns={getTableColumns()}
                        data={tableData || []}
                        loading={tableLoading}
                        pagination={{
                            currentPage: pagination?.page || currentPage,
                            totalItems: pagination?.total || 0,
                            totalPages: pagination?.totalPages || 1,
                            onPageChange: handlePageChange
                        }}
                        pageSize={pagination?.limit || 10}
                        sortable
                        currentSort={{ key: sortKey, direction: sortDirection }}
                        onSort={handleSort}
                        showRefresh
                        showLastUpdated
                        lastUpdated={cardsResponse?.data.lastUpdated}
                        onRefresh={handleRefresh}
                        emptyMessage={`No ${activeTab.replace('-', ' ')} data available`}
                    />
                </div>
            </div>
        </div>
    );
};

export default ReportsPage; 