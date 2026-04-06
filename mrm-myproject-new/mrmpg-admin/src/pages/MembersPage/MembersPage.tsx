import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import "./MembersPage.scss"
import { useLocation, useNavigate } from "react-router-dom";
import type { types } from "@/types";
import type {
    MembersApiResponse,
    TableMemberData,
    DashboardFiltersResponse,
    BaseApiResponse
} from "@/types/apiResponseTypes";
import ui from "@/components/ui";
import layouts from "@/components/layouts";
import { AuthManager, ApiClient, buildDashboardQueryParams } from '@/utils';
import { useNotification } from '@/hooks/useNotification';

interface FilterValues {
    search: string;
    work: string;
    paymentStatus: string;
    location: string;
    checkInDate: string;
}

const MembersPage = (): React.ReactElement => {
    const navigate = useNavigate();
    const notification = useNotification();
    const isInitialLoad = useRef(true);

    const { search } = useLocation();
    const params = useMemo(() => new URLSearchParams(search), [search]);
    const enrollmentType = params.get('enrollment') || 'long-term';
    const [loading, setLoading] = useState(false);
    const [filtersLoading, setFiltersLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalMembers, setTotalMembers] = useState(0);
    const [sortState, setSortState] = useState<{ key: string | null; direction: "asc" | "desc" }>({
        key: null,
        direction: "asc"
    });
    const [membersData, setMembersData] = useState<TableMemberData[]>([]);
    const [filters, setFilters] = useState<FilterValues>({
        search: '',
        work: '',
        paymentStatus: '',
        location: '',
        checkInDate: '',
    });
    const [filterItems, setFilterItems] = useState<types["FilterItemProps"][]>([]);

    // QuickView Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<TableMemberData | null>(null);
    
    // Add Member Modal State
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [addMemberLoading, setAddMemberLoading] = useState(false);

    // Check token validity
    useEffect(() => {
        const checkTokenValidity = () => {
            if (!AuthManager.isTokenValid()) {
                AuthManager.clearAuthData();
                navigate('/login');
            }
        };
        checkTokenValidity();
    }, [navigate]);

    const fetchMembersData = useCallback(async (page: number, filterParams: FilterValues, sortKey: string | null = null, sortDirection: "asc" | "desc" = "asc") => {
        setLoading(true);
        try {
            const queryString = buildDashboardQueryParams(
                page,
                {
                    search: filterParams.search,
                    work: filterParams.work,
                    paymentStatus: filterParams.paymentStatus,
                    location: filterParams.location,
                    rentType: enrollmentType,
                    checkInDate: filterParams.checkInDate,
                },
                sortKey,
                sortDirection,
                10
            );

            const endpoint = `/members/rent/${enrollmentType}/${queryString ? `?${queryString}` : ''}`;

            const apiResponse = await ApiClient.get(endpoint) as MembersApiResponse;
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
            notification.showError('Error fetching members data', error instanceof Error ? error.message : "Check your network connection", 5000);
            setMembersData([]);
            setTotalPages(1);
            setTotalMembers(0);
        } finally {
            setLoading(false);
        }
    }, [enrollmentType, notification]);

    const fetchFilterOptions = useCallback(async () => {
        setFiltersLoading(true);
        try {
            const apiResponse = await ApiClient.get('/filters/members') as DashboardFiltersResponse;
            if (apiResponse.success && apiResponse.data) {
                setFilterItems(apiResponse.data.filters);
            } else {
                setFilterItems([]);
                notification.showError('Failed to fetch filter options', "Check your network connection", 5000);
            }
        } catch (error) {
            notification.showError('Error fetching filter options', error instanceof Error ? error.message : "Contact support", 5000);
        } finally {
            setFiltersLoading(false);
        }
    }, [notification]);


    // Initial data loading
    useEffect(() => {
        if (AuthManager.isAuthenticated() && isInitialLoad.current) {
            fetchFilterOptions();
            fetchMembersData(1, filters, null, "asc");
            isInitialLoad.current = false;
        }
    }, [fetchFilterOptions, fetchMembersData, filters]);

    // Handle enrollment type changes
    useEffect(() => {
        if (AuthManager.isAuthenticated() && !isInitialLoad.current) {
            // Clear current data immediately to prevent showing wrong data
            setMembersData([]);
            setTotalPages(1);
            setTotalMembers(0);

            // Reset filters when enrollment type changes
            const resetFilters = {
                search: '',
                work: '',
                paymentStatus: '',
                location: '',
                checkInDate: '',
            };
            setFilters(resetFilters);
            setCurrentPage(1);

            // Fetch new data for the new enrollment type
            fetchMembersData(1, resetFilters, null, "asc");
        }
    }, [enrollmentType, fetchMembersData]);


    const getHeader = () => {
        switch (enrollmentType) {
            case 'long-term':
                return {
                    title: "Long Term Enrollment Details",
                    subText: "Manage and view detailed information about long-term enrollments",
                    pageInfo: `Total Members: ${totalMembers}`
                };
            case 'short-term':
                return {
                    title: "Short Term Enrollment Details",
                    subText: "Manage and view detailed information about short-term enrollments",
                    pageInfo: `Total Members: ${totalMembers}`
                };
            default:
                return {
                    title: "Long Term Enrollment Details",
                    subText: "Manage and view detailed information about long-term enrollments",
                    pageInfo: `Total Members: ${totalMembers}`
                };
        }
    };


    const getColumns = useCallback((): types["TableColumn"][] => {
        const baseColumns: types["TableColumn"][] = [
            {
                key: "memberId",
                label: "Member ID",
                align: "center",
                width: "12%",
            },
            {
                key: "name",
                label: "Name",
                align: "left",
                render: (value) => (
                    <span className="student-name">{value as string}</span>
                ),
                width: "13%",
                style: { color: "var(--primary-color)" }
            },
            {
                key: "roomNo",
                label: "Room No",
                align: "center",
                width: "10%",
            },
            {
                key: "pgLocation",
                label: "Pg Location",
                align: "center",
                width: "12%",
            },
        ];

        if (enrollmentType === 'long-term') {
            return [
                ...baseColumns,
                {
                    key: "rentAmount",
                    label: "Rent",
                    align: "center",
                    width: "12%",
                    render: (value) => (
                        <div className="amount">
                            <ui.Icons name="indianRupee" size={14} />
                            <span>{value as string}</span>
                        </div>
                    ),
                },
                {
                    key: "advanceAmount",
                    label: "Advance",
                    align: "center",
                    width: "12%",
                    render: (value) => (
                        <div className="amount">
                            <ui.Icons name="indianRupee" size={14} />
                            <span>{value as string}</span>
                        </div>
                    ),
                },
                {
                    key: "paymentStatus",
                    label: "Status",
                    align: "center",
                    width: "15%",
                    render: (value: unknown) => (
                        <span className={`status-badge status-badge--${(value as string).toLowerCase()}`}>
                            {value as string}
                        </span>
                    ),
                }
            ];
        } else {
            return [
                ...baseColumns,
                {
                    key: "dateOfJoining",
                    label: "JoinedOn",
                    align: "center",
                    width: "12%",
                    render: (value) => {
                        const date = new Date(value as string);
                        return (
                            <span>{date.toLocaleDateString()}</span>
                        );
                    }
                },
                {
                    key: "paymentStatus",
                    label: "Status",
                    align: "center",
                    width: "15%",
                    render: (value: unknown) => (
                        <span className={`status-badge status-badge--${(value as string).toLowerCase()}`}>
                            {value as string}
                        </span>
                    ),
                }
            ];
        }
    }, [enrollmentType]);

    // Filter on-change - automatically apply filters
    const onChange = useCallback((id: string, value: string | string[] | number | boolean | Date | { start: string; end: string } | null) => {
        const newFilters = { ...filters, [id]: value as string };
        setFilters(newFilters);
        
        // Auto-apply filters when any filter changes
        setCurrentPage(1);
        fetchMembersData(1, newFilters, sortState.key, sortState.direction);
    }, [filters, sortState.key, sortState.direction, fetchMembersData]);

    const handleRowClick = (row: types["TableData"]) => {
        setSelectedMember(row as TableMemberData);
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

    const handleAddMember = () => {
        setIsAddMemberModalOpen(true);
    };

    const handleCloseAddMemberModal = () => {
        setIsAddMemberModalOpen(false);
    };

    const handleSaveAddMember = async (memberData: FormData) => {
        setAddMemberLoading(true);
        try {
            const apiResponse = await ApiClient.postFormData('/admin/members', memberData) as BaseApiResponse;
            if (apiResponse.success) {
                notification.showSuccess('Member added successfully', 'The new member has been added to the system.', 5000);
                handleCloseAddMemberModal();
                // Refresh the members data
                fetchMembersData(currentPage, filters, sortState.key, sortState.direction);
            } else {
                notification.showError('Failed to add member', apiResponse.message || 'Please try again.', 5000);
            }
        } catch (error) {
            notification.showError('Error adding member', error instanceof Error ? error.message : 'Please check your connection and try again.', 5000);
        } finally {
            setAddMemberLoading(false);
        }
    };

    const handleSort = (key: string, direction: "asc" | "desc") => {
        setSortState({ key, direction });
        fetchMembersData(currentPage, filters, key, direction);
    };

    const handleFilterReset = () => {
        const resetFilters = {
            search: '',
            work: '',
            paymentStatus: '',
            location: '',
            checkInDate: '',
        };
        setFilters(resetFilters);
        setCurrentPage(1);
        fetchMembersData(1, resetFilters, sortState.key, sortState.direction);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchMembersData(page, filters, sortState.key, sortState.direction);
    };

    const headerConfig = getHeader();
    const columnsConfig = getColumns();

    return (
        <>
            <div className="members-page">
                <div className="members-page__header">
                    <layouts.HeaderLayout
                        title={headerConfig.title}
                        subText={headerConfig.subText}
                        pageInfo={headerConfig.pageInfo}
                        buttons={[
                            {
                                label: "Add Member",
                                onClick: handleAddMember,
                                variant: "primary",
                                icon: "plus",
                                loading: addMemberLoading
                            }
                        ]}
                    />
                </div>

                <div className="members-page__content">
                    <div className="members-page__filter-section">
                        <layouts.FilterLayout
                            filters={filtersLoading ? [] : filterItems}
                            layout="grid"
                            columns={4}
                            onReset={handleFilterReset}
                            onChange={onChange}
                            showResetButton
                            collapsible
                            className="members-filters"
                            loading={filtersLoading}    
                        />
                    </div>

                    <div className="members-page__table-section">
                        <layouts.TableLayout
                            columns={columnsConfig}
                            data={membersData}
                            loading={loading}
                            pagination={{
                                currentPage: currentPage,
                                totalPages: totalPages,
                                totalItems: totalMembers,
                                onPageChange: handlePageChange
                            }}
                            pageSize={10}
                            currentSort={sortState}
                            sortable={true}
                            onRowClick={handleRowClick}
                            onSort={handleSort}
                            emptyMessage={`No ${enrollmentType.replace('_', '-')} members found`}
                            className="students-table"
                            showRefresh={true}
                            refreshLoading={loading}
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
                            showViewProfile: true,
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
                        paymentApprovalStatus: selectedMember.currentMonthPayment?.approvalStatus,
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

                <layouts.AddMemberModal
                    isOpen={isAddMemberModalOpen}
                    onClose={handleCloseAddMemberModal}
                    onSave={handleSaveAddMember}
                    loading={addMemberLoading}
                />
            </div>
        </>
    );

};

export default MembersPage;