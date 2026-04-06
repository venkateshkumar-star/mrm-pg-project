import layouts from "@/components/layouts";
import ui from "@/components/ui";
import { useCallback, useEffect, useState } from "react";
import type { types } from "@/types";
import type { ApprovalFiltersResponse, ApprovalMembersResponse, ApprovalStats, BaseApiResponse, CardItem, PaymentApprovalData, PaymentApprovalResponse, PendingRegistrationData, QuickViewMemberData, PaymentQuickViewData, RelievingRequestData, RelievingRequestsResponse } from "@/types/apiResponseTypes";
import { ApiClient } from "@/utils";
import { useNotification } from "@/hooks/useNotification";
import "./ApprovalsPage.scss";

interface ApprovalFilterParams {
    search?: string;
    month?: string;
    year?: string;
    pgLocation?: string;
    rentType?: string;
    paymentStatus?: string;
    approvalStatus?: string;
    page?: number;
    limit?: number;
}

const ApprovalsPage = () => {

    const [activeTab, setActiveTab] = useState("pending_registration");
    const [registrationTableData, setRegistrationTableData] = useState<PendingRegistrationData[]>([]);
    const [paymentTableData, setPaymentTableData] = useState<PaymentApprovalData[]>([]);
    const [relievingRequestsData, setRelievingRequestsData] = useState<RelievingRequestData[]>([]);

    const [TableLoading, setTableLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const notification = useNotification();

    // QuickView Modal state
    const [quickViewModal, setQuickViewModal] = useState<{
        isOpen: boolean;
        memberData: QuickViewMemberData | null;
    }>({
        isOpen: false,
        memberData: null
    });

    // Payment QuickView Modal state
    const [paymentQuickViewModal, setPaymentQuickViewModal] = useState<{
        isOpen: boolean;
        memberData: PaymentQuickViewData | null;
    }>({
        isOpen: false,
        memberData: null
    });

    // Relieving Request Modal state
    const [relievingRequestModal, setRelievingRequestModal] = useState<{
        isOpen: boolean;
        memberData: RelievingRequestData | null;
    }>({
        isOpen: false,
        memberData: null
    });

    // Settlement Modal state
    const [settlementModal, setSettlementModal] = useState<{
        isOpen: boolean;
        memberData: RelievingRequestData | null;
    }>({
        isOpen: false,
        memberData: null
    });

    // Loading states
    const [approveLoading, setApproveLoading] = useState(false);
    const [rejectLoading, setRejectLoading] = useState(false);
    const [fetchingStats, setFetchingStats] = useState(false);
    const [filterItemsLoading, setFilterItemsLoading] = useState(false);

    // Cards stats
    const [cardItems, setCardItems] = useState<CardItem[] | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | string | null>(null);

    // filter items
    const [filterItems, setFilterItems] = useState<types["FilterItemProps"][]>([]);

    // Current filter values
    const [currentFilters, setCurrentFilters] = useState<ApprovalFilterParams>({
        page: 1,
        limit: 10
    });

    const tabsItem = [
        {
            id: "pending_registration",
            label: "Registration Pending",
        },
        {
            id: "pending_payment",
            label: "Payment Pending",
        },
        {
            id: "relieving_requests",
            label: "Relieving Requests",
        }
    ]

    const getTableColums = (): types["TableColumn"][] => {
        switch (activeTab) {
            case "pending_registration":
                return [
                    {
                        key: "name",
                        label: "Name",
                        width: "10%",
                        align: "left" as const,
                    },
                    {
                        key: "rentType",
                        label: "Rent Type",
                        width: "10%"
                    },
                    {
                        key: "pgLocation",
                        label: "PG Location",
                        width: "10%"
                    },
                    {
                        key: "phone",
                        label: "Phone",
                        width: "10%"
                    },
                    {
                        key: "actions",
                        label: "Actions",
                        width: "10%",
                        align: "center" as const,
                        render: (_value: unknown, row: Record<string, unknown>) => (
                            <ui.Button
                                variant="primary"
                                size="small"
                                onClick={() => handleQuickView(row as PendingRegistrationData)}
                                leftIcon={<ui.Icons name="eye" size={14} />}
                            >
                                Quick View
                            </ui.Button>
                        )
                    }
                ]
            case "pending_payment":
                return [
                    {
                        key: "name",
                        label: "Name",
                        width: "15%",
                        align: "left" as const,
                    },
                    {
                        key: "rentType",
                        label: "Rent Type",
                        width: "12%"
                    },
                    {
                        key: "pgLocation",
                        label: "PG Location",
                        width: "15%",
                        align: "center" as const
                    },
                    {
                        key: "phone",
                        label: "Phone",
                        width: "15%"
                    },
                    {
                        key: "rentAmount",
                        label: "Rent",
                        width: "12%",
                        align: "center" as const,
                        render: (value: unknown) => (
                            <div className='currency-value'>
                                <span className='currency-symbol'>
                                    <ui.Icons name="indianRupee" size={14} />
                                </span>
                                <span className='currency-amount'>{value as string}</span>
                            </div>
                        )
                    },
                    {
                        key: "requestedMonthPaymentStatus",
                        label: "Payment",
                        width: "10%",
                        align: "center" as const,
                        render: (value: unknown) => (
                            <span className={`status-badge status-badge--${(value as string).toLowerCase()}`}>
                                {value as string}
                            </span>
                        )
                    },
                    {
                        key: "requestedMonthApprovalStatus",
                        label: "Approval",
                        width: "9%",
                        align: "center" as const,
                        render: (value: unknown) => (
                            <span className={`status-badge status-badge--${(value as string).toLowerCase()}`}>
                                {value as string}
                            </span>
                        )
                    }
                ]
            case "relieving_requests":
                return [
                    {
                        key: "memberMemberId",
                        label: "Member ID",
                        width: "10%",
                        align: "center" as const,
                    },
                    {
                        key: "memberName",
                        label: "Member Name",
                        width: "12%",
                        align: "left" as const,
                    },
                    {
                        key: "pgName",
                        label: "PG Name",
                        width: "15%"
                    },
                    {
                        key: "roomNo",
                        label: "Room",
                        width: "8%",
                        align: "center" as const,
                    },
                    {
                        key: "requestedLeaveDate",
                        label: "Leave Date",
                        width: "10%",
                        align: "center" as const,
                        render: (value: unknown) => {
                            const date = new Date(value as string);
                            return date.toLocaleDateString('en-IN');
                        }
                    },
                    {
                        key: "memberPhone",
                        label: "Phone",
                        width: "10%"
                    },
                    {
                        key: "status",
                        label: "Status",
                        width: "8%",
                        align: "center" as const,
                        render: (value: unknown) => (
                            <span className={`status-badge status-badge--${(value as string).toLowerCase()}`}>
                                {value as string}
                            </span>
                        )
                    },
                ]
            default:
                return [];
        }
    }

    const getTableData = (): Record<string, unknown>[] => {
        switch (activeTab) {
            case 'pending_registration':
                return registrationTableData as unknown as Record<string, unknown>[];
            case 'pending_payment':
                return paymentTableData as unknown as Record<string, unknown>[];
            case 'relieving_requests':
                return relievingRequestsData as unknown as Record<string, unknown>[];
            default:
                return [];
        }
    }

    // Function to get pending registrations data
    const fetchPendingRegistrationsData = useCallback(async (page: number = currentPage) => {
        setTableLoading(true);
        try {

            const apiResponse = await ApiClient.get(`/approvals/members?page=${page}&limit=10`) as ApprovalMembersResponse;
            if (apiResponse && apiResponse.success) {
                setRegistrationTableData(apiResponse.data);
                setCurrentPage(apiResponse.pagination.page);
                setTotalPages(apiResponse.pagination.totalPages);
            }
            else {
                setRegistrationTableData([]);
                setCurrentPage(1);
                setTotalPages(1);
                notification.showError('Failed to fetch pending registrations', "Contact support", 2000);
            }

        } catch (_error) {
            notification.showError('Error fetching filter options', _error instanceof Error ? _error.message : "Contact support", 5000);
            return [];
        }
        finally {
            setTableLoading(false);
        }

    }, [notification, currentPage]);

    // Function to get relieving requests data
    const fetchRelievingRequestsData = useCallback(async (page: number = currentPage) => {
        setTableLoading(true);
        try {
            const apiResponse = await ApiClient.get(`/approvals/leaving-requests?page=${page}&limit=10`) as RelievingRequestsResponse;
            if (apiResponse && apiResponse.success) {
                setRelievingRequestsData(apiResponse.data);
                setCurrentPage(apiResponse.pagination.page);
                setTotalPages(apiResponse.pagination.totalPages);
            } else {
                setRelievingRequestsData([]);
                setCurrentPage(1);
                setTotalPages(1);
                notification.showError(apiResponse.error || 'Failed to fetch relieving requests', apiResponse.message || 'Contact support', 2000);
            }
        } catch (_error) {
            notification.showError('Error fetching filter options', _error instanceof Error ? _error.message : "Contact support", 5000);
            setRelievingRequestsData([]);
        } finally {
            setTableLoading(false);
        }
    }, [notification, currentPage]);

    // Build query parameters for approval filters
    const buildApprovalQueryParams = (filterParams: ApprovalFilterParams): string => {
        const params = new URLSearchParams();

        // Add pagination
        if (filterParams.page) {
            params.append('page', filterParams.page.toString());
        }
        params.append('limit', (filterParams.limit || 10).toString());

        // Add search if provided
        if (filterParams.search?.trim()) {
            params.append('search', filterParams.search.trim());
        }

        // Add other filter parameters
        if (filterParams.month) {
            params.append('month', filterParams.month);
        }
        if (filterParams.year) {
            params.append('year', filterParams.year);
        }
        if (filterParams.pgLocation) {
            params.append('pgLocation', filterParams.pgLocation);
        }
        if (filterParams.rentType) {
            params.append('rentType', filterParams.rentType);
        }
        if (filterParams.paymentStatus) {
            params.append('paymentStatus', filterParams.paymentStatus);
        }
        if (filterParams.approvalStatus) {
            params.append('approvalStatus', filterParams.approvalStatus);
        }

        return params.toString();
    };

    // Function to get pending payment data
    const fetchPaymentsData = useCallback(async (filterParams: ApprovalFilterParams = currentFilters) => {
        setTableLoading(true);
        try {
            const queryString = buildApprovalQueryParams(filterParams);
            const apiResponse = await ApiClient.get(`/approvals/payments?${queryString}`) as PaymentApprovalResponse;
            if (apiResponse && apiResponse.success) {
                setPaymentTableData(apiResponse.data.tableData);
                setCurrentPage(apiResponse.data.pagination.page);
                setTotalPages(apiResponse.data.pagination.totalPages);
            }
            else {
                setPaymentTableData([]);
                setCurrentPage(1);
                setTotalPages(1);
                notification.showError(apiResponse.error || 'Failed to fetch pending payments', apiResponse.message || 'Contact support', 2000);
            }

        } catch {
            notification.showError('Error fetching pending payments', "Check your network connection", 2000);
            return [];
        }
        finally {
            setTableLoading(false);
        }
    }, [currentFilters, notification]);

    // Function to get the filters for payment approvals
    const fetchPaymentApprovalFilters = useCallback(async () => {
        setFilterItemsLoading(true);
        try {
            const apiResponse = await ApiClient.get("/filters/payments") as ApprovalFiltersResponse;
            if (apiResponse && apiResponse.success) {
                setFilterItems(apiResponse.data.filters);
            } else {
                setFilterItems([]);
                notification.showError(apiResponse.error || 'Failed to fetch payment approval filters', apiResponse.message || 'Contact support', 2000);
            }
        } catch {
            notification.showError('Error fetching filters', "Check your network connection", 2000);
        }
        finally {
            setFilterItemsLoading(false);
        }
    }, [notification]);

    //Function to get tab cards
    const fetchApprovalStats = useCallback(async (filterParams: ApprovalFilterParams = currentFilters) => {
        setFetchingStats(true);
        try {
            let apiUrl = '';

            // Build different endpoints based on active tab
            switch (activeTab) {
                case 'pending_registration':
                    apiUrl = `/stats/approvals/${activeTab}`;
                    break;
                case 'pending_payment': {
                    const queryString = buildApprovalQueryParams(filterParams);
                    apiUrl = `/stats/approvals/${activeTab}${queryString ? `?${queryString}` : ''}`;
                    break;
                }
                case 'relieving_requests':
                    apiUrl = `/stats/approvals/${activeTab}`;
                    break;
                default:
                    apiUrl = `/stats/approvals/${activeTab}`;
                    break;
            }

            const apiResponse = await ApiClient.get(apiUrl) as ApprovalStats;
            if (apiResponse.success && apiResponse.data) {
                setCardItems(apiResponse.data.cards);
                // Since each tab now returns its own lastUpdated, extract the appropriate value
                if (apiResponse.data.lastUpdated) {
                    const lastUpdatedData = apiResponse.data.lastUpdated;
                    switch (activeTab) {
                        case 'pending_registration':
                            setLastUpdated(lastUpdatedData.registration || lastUpdatedData);
                            break;
                        case 'pending_payment':
                            setLastUpdated(lastUpdatedData.payment || lastUpdatedData);
                            break;
                        default:
                            // For new tabs or direct lastUpdated values
                            setLastUpdated(typeof lastUpdatedData === 'object' ? new Date() : lastUpdatedData);
                            break;
                    }
                }
            } else {
                notification.showError(apiResponse?.message || 'Failed to fetch approval stats', apiResponse.error, 2000);
            }
        } catch {
            notification.showError('Error fetching approval stats', "Check your network connection", 2000);
        } finally {
            setFetchingStats(false);
        }
    }, [notification, currentFilters, activeTab]);

    // Auto-filtering onChange handler
    const onChange = useCallback(async (id: string, value: string | string[] | number | boolean | Date | { start: string; end: string } | null) => {
        const filterParams: ApprovalFilterParams = {
            page: 1,
            limit: currentFilters.limit || 10,
            search: id === 'search' ? (value as string) || '' : currentFilters.search || '',
            month: id === 'month' ? (value as string) || '' : currentFilters.month || '',
            year: id === 'year' ? (value as string) || '' : currentFilters.year || '',
            pgLocation: id === 'pgLocation' ? (value as string) || '' : currentFilters.pgLocation || '',
            rentType: id === 'rentType' ? (value as string) || '' : currentFilters.rentType || '',
            paymentStatus: id === 'paymentStatus' ? (value as string) || '' : currentFilters.paymentStatus || '',
            approvalStatus: id === 'approvalStatus' ? (value as string) || '' : currentFilters.approvalStatus || ''
        };

        setCurrentFilters(filterParams);

        try {
            await Promise.all([
                fetchPaymentsData(filterParams),
                fetchApprovalStats(filterParams)
            ]);
        } catch {
            notification.showError('Error applying filters', 'Please try again', 2000);
        }
    }, [currentFilters, fetchPaymentsData, fetchApprovalStats, notification]);

    // Function to reset filters
    const handleResetFilters = useCallback(() => {
        const resetFilters: ApprovalFilterParams = {
            page: 1,
            limit: 10
        };

        setCurrentFilters(resetFilters);

        // Reload data with reset filters
        fetchPaymentsData(resetFilters);
        fetchApprovalStats(resetFilters);
    }, [fetchPaymentsData, fetchApprovalStats]);

    // Effect to load data when activeTab changes
    useEffect(() => {
        switch (activeTab) {
            case "pending_registration":
                fetchPendingRegistrationsData();
                fetchApprovalStats();
                break;
            case "pending_payment":
                fetchPaymentsData();
                fetchPaymentApprovalFilters();
                fetchApprovalStats();
                break;
            case "relieving_requests":
                fetchRelievingRequestsData();
                fetchApprovalStats();
                break;
            default:
                break;
        }
    }, [activeTab, fetchPendingRegistrationsData, fetchApprovalStats, fetchPaymentsData, fetchPaymentApprovalFilters, fetchRelievingRequestsData]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        switch (activeTab) {
            case "pending_registration":
                fetchPendingRegistrationsData(page);
                break;
            case "pending_payment":
                fetchPaymentsData({ ...currentFilters, page });
                break;
            case "relieving_requests":
                fetchRelievingRequestsData(page);
                break;
            default:
                break;
        }
    };

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
    };

    // QuickView Modal handlers
    const handleQuickView = (memberData: PendingRegistrationData) => {
        const quickViewData: QuickViewMemberData = {
            id: memberData.id,
            memberId: memberData.memberId,
            name: memberData.name,
            email: memberData.email,
            phone: memberData.phone,
            roomNo: '',
            rentType: memberData.rentType,
            profileImage: memberData.photoUrl,
            paymentStatus: 'PENDING',
            paymentApprovalStatus: 'PENDING',
            documents: [
                { name: 'Photo', url: memberData.photoUrl },
                { name: 'ID proof', url: memberData.documentUrl}
            ].filter(doc => doc.url),
            dob: memberData.dob,
            work: memberData.work,
            location: memberData.location,
            pgLocation: memberData.pgLocation,
            dateOfRelieving: memberData.dateOfRelieving as string | undefined
        };

        setQuickViewModal({
            isOpen: true,
            memberData: quickViewData
        });
    };

    const handleCloseQuickView = () => {
        setQuickViewModal({
            isOpen: false,
            memberData: null
        });
    };

    // Payment QuickView Modal handlers
    const handlePaymentQuickView = (memberData: PaymentApprovalData) => {
        const paymentQuickViewData: PaymentQuickViewData = {
            id: memberData.id,
            memberId: memberData.memberId,
            name: memberData.name,
            dob: memberData.dob,
            gender: memberData.gender,
            location: memberData.location,
            email: memberData.email,
            phone: memberData.phone,
            work: memberData.work,
            profileImage: memberData.photoUrl,
            rentType: memberData.rentType,
            pgLocation: memberData.pgLocation,
            pgName: memberData.pgName,
            roomNo: memberData.roomNo,
            rent: memberData.rentAmount,
            advanceAmount: memberData.advanceAmount,
            dateOfJoining: memberData.dateOfJoining,
            paymentDetails: {
                id: memberData.requestedMonthPayment?.id,
                paymentStatus: memberData.requestedMonthPayment?.paymentStatus,
                approvalStatus: memberData.requestedMonthPayment?.approvalStatus,
                amount: memberData.requestedMonthPayment?.amount,
                month: memberData.requestedMonthPayment?.month,
                year: memberData.requestedMonthPayment?.year,
                dueDate: memberData.requestedMonthPayment?.dueDate,
                overdueDate: memberData.requestedMonthPayment?.overdueDate,
                paidDate: memberData.requestedMonthPayment?.paidDate,
                rentBillScreenshot: memberData.requestedMonthPayment?.rentBillScreenshot,
                electricityBillScreenshot: memberData.requestedMonthPayment?.electricityBillScreenshot,
                attemptNumber: memberData.requestedMonthPayment?.attemptNumber,
                createdAt: memberData.requestedMonthPayment?.createdAt
            },
            documents: [
                { name: 'Profile Photo', url: memberData.photoUrl },
                { name: 'ID Proof', url: memberData.documentUrl }
            ].filter(doc => doc.url)
        };

        setPaymentQuickViewModal({
            isOpen: true,
            memberData: paymentQuickViewData
        });
    };

    const handleClosePaymentQuickView = () => {
        setPaymentQuickViewModal({
            isOpen: false,
            memberData: null
        });
    };

    // Relieving Request Modal handlers
    const handleRelievingRequestView = (requestData: RelievingRequestData) => {
        setRelievingRequestModal({
            isOpen: true,
            memberData: requestData
        });
    };

    const handleCloseRelievingRequestModal = () => {
        setRelievingRequestModal({
            isOpen: false,
            memberData: null
        });
    };

    // Settlement Modal handlers
    const handleOpenSettlementModal = (requestId: string) => {
        const requestData = relievingRequestsData.find(request => request.id === requestId);
        if (requestData) {
            setSettlementModal({
                isOpen: true,
                memberData: requestData
            });
            // Close the relieving request modal
            handleCloseRelievingRequestModal();
        }
    };

    const handleCloseSettlementModal = () => {
        setSettlementModal({
            isOpen: false,
            memberData: null
        });
    };

    const handleApproveUser = async (userId: string, pgId: string, formData: { roomId: string; rentAmount?: string; pricePerDay?: string; advanceAmount?: string; pgLocation: string; dateOfJoining?: string; dateOfRelieving?: string }) => {
        setApproveLoading(true);
        try {
            const approveForm = {
                status: 'APPROVED',
                pgId: pgId,
                ...formData
            }

            const apiResponse = await ApiClient.put(`/approvals/members/${userId}`, approveForm) as BaseApiResponse;

            if (apiResponse && apiResponse.success) {
                notification.showSuccess('Member Approved', 'A new member has been added successfully in ' + formData.pgLocation);
                fetchPendingRegistrationsData();
                handleCloseQuickView();
            }
            else {
                notification.showError(apiResponse?.message || 'Member Approval Failed', 'Failed to approve member in ' + formData.pgLocation);
            }
        } catch {
            notification.showError('Member Approval Failed', 'Failed to approve member in ' + formData.pgLocation);
        } finally {
            setApproveLoading(false);
        }
    };

    const handleRejectUser = async (userId: string) => {
        setRejectLoading(true);
        try {
            const rejectForm = {
                status: 'REJECTED',
            };

            const apiResponse = await ApiClient.put(`/approvals/members/${userId}`, rejectForm) as BaseApiResponse;

            if (apiResponse && apiResponse.success) {
                notification.showSuccess('Member Rejected', 'Member has been rejected successfully');
                fetchPendingRegistrationsData();
                handleCloseQuickView();
            } else {
                notification.showError(apiResponse?.message || 'Member Rejection Failed', 'Failed to reject member');
            }
        } catch {
            notification.showError('Member Rejection Failed', 'Failed to reject member');
        } finally {
            setRejectLoading(false);
        }
    };

    const handleApprovePayment = async (paymentId: string) => {
        setApproveLoading(true);
        try {
            const approveForm = {
                approvalStatus: 'APPROVED'
            };

            const apiResponse = await ApiClient.put(`/approvals/payments/${paymentId}`, approveForm) as BaseApiResponse;

            if (apiResponse && apiResponse.success) {
                notification.showSuccess('Payment Approved', 'Payment has been approved successfully');
                fetchPaymentsData(currentFilters);
                fetchApprovalStats(currentFilters);
                handleClosePaymentQuickView();
            } else {
                notification.showError(apiResponse?.message || 'Payment Approval Failed', 'Failed to approve payment');
            }
        } catch {
            notification.showError('Payment Approval Failed', 'Failed to approve payment');
        } finally {
            setApproveLoading(false);
        }
    };

    const handleRejectPayment = async (paymentId: string) => {
        setRejectLoading(true);
        try {
            const rejectForm = {
                approvalStatus: 'REJECTED'
            };

            const apiResponse = await ApiClient.put(`/approvals/payments/${paymentId}`, rejectForm) as BaseApiResponse;

            if (apiResponse && apiResponse.success) {
                notification.showSuccess('Payment Rejected', 'Payment has been rejected successfully');
                fetchPaymentsData(currentFilters);
                fetchApprovalStats(currentFilters);
                handleClosePaymentQuickView();
            } else {
                notification.showError(apiResponse?.message || 'Payment Rejection Failed', 'Failed to reject payment');
            }
        } catch {
            notification.showError('Payment Rejection Failed', 'Failed to reject payment');
        } finally {
            setRejectLoading(false);
        }
    };

    // Relieving Request API handlers
    const handleApproveRelievingRequest = async (requestId: string, formData?: { finalAmount: string; paymentMethod: 'CASH' | 'ONLINE'; settlementProof?: File }) => {
        setApproveLoading(true);
        try {
            let approveForm: {
                approvalStatus: 'APPROVED';
                finalAmount?: number;
                paymentMethod?: 'CASH' | 'ONLINE';
            } = {
                approvalStatus: 'APPROVED'
            };

            // If form data is provided (from settlement modal), include it
            if (formData) {
                approveForm = {
                    ...approveForm,
                    finalAmount: parseFloat(formData.finalAmount),
                    paymentMethod: formData.paymentMethod
                };

                // Handle file upload if provided
                if (formData.settlementProof) {
                    const formDataWithFile = new FormData();
                    formDataWithFile.append('approvalStatus', 'APPROVED');
                    formDataWithFile.append('finalAmount', formData.finalAmount);
                    formDataWithFile.append('paymentMethod', formData.paymentMethod);
                    formDataWithFile.append('settlementProof', formData.settlementProof);

                    const apiResponse = await ApiClient.patchFormData(`/approvals/leaving-requests/${requestId}/${formData.paymentMethod}`, formDataWithFile) as BaseApiResponse;

                    if (apiResponse && apiResponse.success) {
                        notification.showSuccess('Relieving Request Approved', 'Member relieving request has been approved and settled successfully');
                        fetchRelievingRequestsData();
                        fetchApprovalStats();
                        handleCloseSettlementModal();
                        return;
                    } else {
                        throw new Error(apiResponse?.message || 'Failed to approve relieving request');
                    }
                }
            }

            const apiResponse = await ApiClient.patch(`/approvals/leaving-requests/${requestId}/${approveForm.paymentMethod}`, approveForm) as BaseApiResponse;

            if (apiResponse && apiResponse.success) {
                notification.showSuccess('Relieving Request Approved', 'Member relieving request has been approved successfully');
                fetchRelievingRequestsData();
                fetchApprovalStats();
                handleCloseSettlementModal();
            } else {
                notification.showError(apiResponse?.message || 'Relieving Request Approval Failed', 'Failed to approve relieving request');
            }
        } catch {
            notification.showError('Relieving Request Approval Failed', 'Failed to approve relieving request');
        } finally {
            setApproveLoading(false);
        }
    };

    const handleRejectRelievingRequest = async (requestId: string) => {
        setRejectLoading(true);
        try {
            const rejectForm = {
                approvalStatus: 'REJECTED'
            };

            const apiResponse = await ApiClient.put(`/approvals/leaving-requests/${requestId}`, rejectForm) as BaseApiResponse;

            if (apiResponse && apiResponse.success) {
                notification.showSuccess('Relieving Request Rejected', 'Member relieving request has been rejected successfully');
                fetchRelievingRequestsData();
                fetchApprovalStats();
                handleCloseSettlementModal();
            } else {
                notification.showError(apiResponse?.message || 'Relieving Request Rejection Failed', 'Failed to reject relieving request');
            }
        } catch {
            notification.showError('Relieving Request Rejection Failed', 'Failed to reject relieving request');
        } finally {
            setRejectLoading(false);
        }
    };

    return (
        <div className="approvals-page">
            <div className="approvals-page__header">
                <layouts.HeaderLayout title="Approval Management System" subText="View and manage pending registration and payment approvals" />
            </div>
            <div className="approvals-page__content">
                <div className="approvals-page__tabs">
                    <ui.Tabs tabs={tabsItem} activeTab={activeTab} onTabChange={handleTabChange} showCounts />
                </div>
                {activeTab === 'pending_payment' && (
                    <div className="approvals-page__filters">
                        <layouts.FilterLayout
                            filters={filterItems}
                            loading={filterItemsLoading}
                            columns={4}
                            showResetButton
                            onChange={onChange}
                            onReset={handleResetFilters} />
                    </div>
                )}
                <div className="approvals-page__cards">
                    <layouts.CardGrid
                        cards={cardItems ? cardItems : [{ icon: "clock" }, { icon: "clock" }, { icon: "clock" }, { icon: "clock" }]}
                        columns={4} gap="md"
                        loading={fetchingStats}
                        showRefresh
                        onRefresh={() => {
                            fetchApprovalStats(currentFilters);
                            switch (activeTab) {
                                case 'pending_registration':
                                    fetchPendingRegistrationsData();
                                    break;
                                case 'pending_payment':
                                    fetchPaymentsData(currentFilters);
                                    break;
                                case 'relieving_requests':
                                    fetchRelievingRequestsData();
                                    break;
                                default:
                                    break;
                            }
                        }}
                        lastUpdated={lastUpdated || undefined}
                        className="approvals-page__card-grid" />
                </div>
                <div className="approvals-page__table">
                    <layouts.TableLayout
                        columns={getTableColums()}
                        data={getTableData()}
                        loading={TableLoading}
                        pagination={{
                            currentPage: currentPage,
                            totalPages: totalPages,
                            totalItems: getTableData().length,
                            onPageChange: handlePageChange
                        }}
                        onRowClick={
                            activeTab === 'pending_payment'
                                ? (row) => handlePaymentQuickView(row as PaymentApprovalData)
                                : activeTab === 'relieving_requests'
                                    ? (row) => handleRelievingRequestView(row as unknown as RelievingRequestData)
                                    : undefined
                        }
                        className={
                            activeTab === 'pending_payment' || activeTab === 'relieving_requests'
                                ? 'table--clickable'
                                : ''
                        }
                    />
                </div>
            </div>

            <layouts.QuickViewModal
                isOpen={quickViewModal.isOpen}
                onClose={handleCloseQuickView}
                memberData={quickViewModal.memberData}
                modelLayouts={{
                    paymentInfo: false,
                    documents: true,
                    approvalForm: true,
                    showViewProfile: false
                }}
                onApproveUser={handleApproveUser}
                onDeleteUser={() => console.log("DELETED USER")}
                onRejectUser={handleRejectUser}
                approveLoading={approveLoading}
                rejectLoading={rejectLoading}
            />

            <layouts.PaymentQuickViewModal
                isOpen={paymentQuickViewModal.isOpen}
                onClose={handleClosePaymentQuickView}
                memberData={paymentQuickViewModal.memberData}
                onApprovePayment={handleApprovePayment}
                onRejectPayment={handleRejectPayment}
                onPaymentUpdated={() => {
                    fetchPaymentsData(currentFilters);
                    fetchApprovalStats(currentFilters);
                }}
                approveLoading={approveLoading}
                rejectLoading={rejectLoading}
            />

            <layouts.RelievingRequestModal
                isOpen={relievingRequestModal.isOpen}
                onClose={handleCloseRelievingRequestModal}
                memberData={relievingRequestModal.memberData}
                onProcessRequest={handleOpenSettlementModal}
            />

            <layouts.SettlementModal
                isOpen={settlementModal.isOpen}
                onClose={handleCloseSettlementModal}
                memberData={settlementModal.memberData}
                onApprove={handleApproveRelievingRequest}
                onReject={handleRejectRelievingRequest}
                approveLoading={approveLoading}
                rejectLoading={rejectLoading}
            />
        </div>
    );
};

export default ApprovalsPage;
