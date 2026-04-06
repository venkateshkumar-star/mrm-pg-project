import React, { useState, useEffect, useCallback, useRef } from 'react';
import layouts from "@layouts/index";
import type { types } from "@/types";
import './DashboardPage.scss';
import { AuthManager, ApiClient, buildDashboardQueryParams } from '@/utils';
import { useNavigate } from 'react-router-dom';
import type {
    AdminResponse,
    TableMemberData,
    DashboardApiResponse,
    CardItem,
    DashboardStatsResponse,
    DashboardFiltersResponse
} from '@/types/apiResponseTypes';
import ui from '@/components/ui';
import { useNotification } from '@/hooks/useNotification';


interface FilterValues {
    search: string;
    work: string;
    paymentStatus: string;
    location: string;
    pgLocation: string | string[];
    roomId: string;
    rentType: string;
    pgId: string | string[];
}

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const notification = useNotification();
    const isInitialLoad = useRef(true);

    // Check token validity periodically
    useEffect(() => {
        const checkTokenValidity = () => {
            if (!AuthManager.isTokenValid()) {
                AuthManager.clearAuthData();
                navigate('/login');
            }
        };
        checkTokenValidity();
    }, [navigate]);

    // Loading states
    const [tableLoading, setTableLoading] = useState(false);
    const [cardLoading, setCardLoading] = useState(false);
    const [filtersLoading, setFiltersLoading] = useState(false);

    const [, setStaffData] = useState<AdminResponse | null>(null);
    const [membersData, setMembersData] = useState<TableMemberData[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalMembers, setTotalMembers] = useState(0);
    const [sortState, setSortState] = useState<{ key: string | null; direction: "asc" | "desc" }>({
        key: null,
        direction: "asc"
    });
    const [filters, setFilters] = useState<FilterValues>({
        search: '',
        work: '',
        paymentStatus: '',
        location: '',
        pgLocation: [],
        roomId: '',
        rentType: '',
        pgId: [],
    });

    // Dashboard Stats Card
    const [cards, setCards] = useState<CardItem[]>();
    const [lastUpdated, setLastUpdated] = useState<Date | string | undefined>(undefined);

    // QuickView Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<TableMemberData | null>(null);

    // Filter state
    const [filterItems, setFilterItems] = useState<types["FilterItemProps"][]>([]);


    // Authentication check and staff data extraction
    useEffect(() => {
        const checkAuthentication = () => {
            if (!AuthManager.isAuthenticated()) {
                navigate('/login');
                return;
            }

            const extractedStaffData = AuthManager.getStaffData() as AdminResponse | null;
            if (extractedStaffData) {
                setStaffData(extractedStaffData);
            } else {
                AuthManager.clearAuthData();
                navigate('/login');
            }
        };

        checkAuthentication();
    }, [navigate]);

    const fetchMembersData = useCallback(async (page: number, filterParams: FilterValues, sortKey: string | null = null, sortDirection: "asc" | "desc" = "asc") => {
        setTableLoading(true);
        try {
            const queryString = buildDashboardQueryParams(
                page,
                {
                    search: filterParams.search,
                    work: filterParams.work,
                    paymentStatus: filterParams.paymentStatus,
                    location: filterParams.location,
                    pgLocation: filterParams.pgLocation,
                    roomId: filterParams.roomId,
                    rentType: filterParams.rentType,
                    pgId: filterParams.pgId,
                },
                sortKey,
                sortDirection,
                10
            );

            const endpoint = `/members${queryString ? `?${queryString}` : ''}`;

            const apiResponse = await ApiClient.get(endpoint) as DashboardApiResponse;
            if (apiResponse.success && apiResponse.data) {
                setMembersData(apiResponse.data.tableData);
                setTotalPages(apiResponse.pagination?.totalPages || 1);
                setTotalMembers(apiResponse.pagination?.total || 0);
                setCurrentPage(apiResponse.pagination?.page || page);
            } else {
                setMembersData([]);
                setTotalPages(1);
                setTotalMembers(0);
                notification.showError(apiResponse.message || 'Failed to fetch members data', apiResponse.error || "Contact support", 5000);
            }

        } catch (error) {
            notification.showError('Error fetching filter options', error instanceof Error ? error.message : "Contact support", 5000);
            setMembersData([]);
            setTotalPages(1);
            setTotalMembers(0);
        } finally {
            setTableLoading(false);
        }
    }, [notification]);

    const fetchDashboardStats = useCallback(async () => {
        setCardLoading(true);

        try {

            const apiResponse = await ApiClient.get('/stats/dashboard') as DashboardStatsResponse;
            if (apiResponse.success && apiResponse.data) {
                setCards(apiResponse.data.cards || []);
                setLastUpdated(apiResponse.data.lastUpdated);
            } else {
                setCards([]);
                notification.showError(apiResponse.message || 'Failed to fetch dashboard cards', apiResponse.error || "Contact support", 5000);
            }
        } catch (error) {
            notification.showError('Error fetching filter options', error instanceof Error ? error.message : "Contact support", 5000);
            setCards([]);
        }
        finally {
            setCardLoading(false);
        }

    }, [notification]);

    const fetchFilterOptions = useCallback(async () => {
        setFiltersLoading(true);
        try {

            const apiResponse = await ApiClient.get('/filters/dashboard') as DashboardFiltersResponse
            if (apiResponse.success && apiResponse.data) {
                setFilterItems(apiResponse.data.filters);
            }
            else {
                setFilterItems([]);
                notification.showError('Failed to fetch filter options', "Check your network connection", 5000);
            }

        } catch (error) {
            notification.showError('Error fetching filter options', error instanceof Error ? error.message : "Contact support", 5000);
        } finally {
            setFiltersLoading(false);
        }
    }, [notification]);

    // Filter on-change - automatically apply filters
    const onChange = useCallback((id: string, value: string | string[] | number | boolean | Date | { start: string; end: string } | null) => {
        const newFilters = { ...filters, [id]: value };
        setFilters(newFilters);
        
        // Auto-apply filters when any filter changes
        setCurrentPage(1);
        fetchMembersData(1, newFilters, sortState.key, sortState.direction);
    }, [filters, sortState.key, sortState.direction, fetchMembersData]);

    const handleResetFilters = () => {
        const resetFilters = {
            search: '',
            work: '',
            paymentStatus: '',
            location: '',
            pgLocation: [] as string[],
            roomId: '',
            rentType: '',
            pgId: [] as string[],
        };
        setFilters(resetFilters);
        setCurrentPage(1);
        fetchMembersData(1, resetFilters, sortState.key, sortState.direction);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchMembersData(page, filters, sortState.key, sortState.direction);
    };

    const handleSort = (key: string, direction: "asc" | "desc") => {
        setSortState({ key, direction });
        fetchMembersData(currentPage, filters, key, direction);
    };

    // Initial data loading - only runs once when component mounts
    useEffect(() => {
        if (AuthManager.isAuthenticated() && isInitialLoad.current) {
            fetchDashboardStats();
            fetchFilterOptions();
            fetchMembersData(1, filters, null, "asc");
            isInitialLoad.current = false;
        }
    }, [fetchDashboardStats, fetchFilterOptions, fetchMembersData, filters]);

    // QuickView Modal Handlers
    const handleRowClick = (row: TableMemberData) => {
        setSelectedMember(row);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedMember(null);
    };

    const handleDeleteUser = (userId: string) => {
        console.log(`Delete user with ID: ${userId}`);
        handleCloseModal();
    };

    const tableColumns: types["TableColumn"][] = [
        {
            key: "memberId",
            label: "Member ID",
            width: "10%",
            align: "center" as const,
        },
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
            key: "roomNo",
            label: "Room No",
            width: "10%",
            align: "center" as const
        },
        {
            key: "advanceAmount",
            label: "Advance",
            width: "10%",
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
            key: "rentAmount",
            label: "Rent",
            width: "10%",
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
            key: "paymentStatus",
            label: "Status",
            width: "10%",
            align: "center" as const,
            render: (value: unknown) => (
                <span className={`status-badge status-badge--${(value as string).toLowerCase()}`}>
                    {value as string}
                </span>
            )
        }
    ];

    return (
        <>
            <div className='dashboard-page'>
                <div className='dashboard-page__header'>
                    <layouts.HeaderLayout
                        title='Dashboard'
                        subText='Manage and view detailed information of PG members and trends'
                    />
                </div>

                <div className='dashboard-page__content'>
                    <div className='dashboard-page__cards'>
                        <layouts.CardGrid
                            cards={cards ? cards : [{ icon: "clock" }, { icon: "clock" }, { icon: "clock" }, { icon: "clock" }]}
                            loading={cardLoading}
                            columns={4}
                            gap='md'
                            showRefresh
                            refreshLoading={cardLoading}
                            onRefresh={fetchDashboardStats}
                            lastUpdated={lastUpdated}
                            className='dashboard-cards'
                        />
                    </div>

                    <div className='dashboard-page__filter-section'>
                        <layouts.FilterLayout
                            filters={filtersLoading ? [] : filterItems}
                            className="dashboard-filters"
                            collapsible={true}
                            columns={4}
                            showResetButton
                            onReset={handleResetFilters}
                            onChange={onChange}
                            loading={filtersLoading}
                        />
                    </div>

                    <div className='dashboard-page__table-section'>
                        <layouts.TableLayout
                            columns={tableColumns}
                            data={membersData}
                            loading={tableLoading}
                            pagination={{
                                currentPage: currentPage,
                                totalPages: totalPages,
                                totalItems: totalMembers,
                                onPageChange: handlePageChange
                            }}
                            pageSize={10}
                            currentSort={sortState}
                            onSort={handleSort}
                            onRowClick={(row) => handleRowClick(row as TableMemberData)}
                            emptyMessage="No members found"
                            showRefresh={true}
                            refreshLoading={tableLoading}
                            onRefresh={() => fetchMembersData(currentPage, filters, sortState.key, sortState.direction)}
                        />
                    </div>
                </div>


                <layouts.QuickViewModal
                    isOpen={isModalOpen}
                    modelLayouts={
                        {
                            paymentInfo: true,
                            documents: true,
                            approvalForm: false,
                            showViewProfile: true
                        }
                    }
                    onClose={handleCloseModal}
                    memberData={selectedMember ? {
                        id: selectedMember.id,
                        memberId: selectedMember.memberId,
                        name: selectedMember.name,
                        roomNo: selectedMember.roomNo,
                        rentType: selectedMember.rentType,
                        profileImage: selectedMember.photoUrl,
                        phone: selectedMember.phone,
                        email: selectedMember.email,
                        paymentStatus: selectedMember.paymentStatus,
                        paymentApprovalStatus: selectedMember.currentMonthPayment?.approvalStatus || "PENDING",
                        dob: selectedMember.dob,
                        work: selectedMember.work,
                        location: selectedMember.location,
                        advanceAmount: selectedMember.advanceAmount,
                        rent: selectedMember.rentAmount,
                        joinedOn: new Date(selectedMember.dateOfJoining).toLocaleDateString('en-IN'),
                        documents: [{
                            name: 'ID Proof',
                            url: selectedMember.documentUrl
                        }]
                    } : null}
                    onDeleteUser={handleDeleteUser}
                />

            </div>
        </>
    )

}

export default DashboardPage;