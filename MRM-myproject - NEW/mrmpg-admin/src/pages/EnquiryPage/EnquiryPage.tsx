import React, { useState, useEffect, useCallback, useRef } from 'react';
import layouts from "@/components/layouts";
import type { CardItem, EnquiryData, EnquiryDataResponse, EnquiryFiltersResponse, EnquiryStatsResponse } from '@/types/apiResponseTypes';
import { ApiClient, AuthManager, buildEnquiryQueryParams } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '@/hooks/useNotification';
import "./EnquiryPage.scss";
import type { types } from '@/types';
import ui from '@/components/ui';

interface FilterValues {
    search: string;
    status: string;
    resolvedBy: string;
}

const EnquiryPage = (): React.ReactElement => {
    const navigate = useNavigate();
    const notification = useNotification();
    const isInitialLoad = useRef(true);

    // Loading states
    const [cardLoading, setCardLoading] = useState(false);
    const [filterLoading, setFilterLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);

    // Cards state
    const [cards, setCards] = useState<CardItem[]>();
    const [lastUpdated, setLastUpdated] = useState<Date | string | undefined>(undefined);

    // Filter state
    const [filters, setFilters] = useState<types["FilterItemProps"][]>([]);
    const [filterValues, setFilterValues] = useState<FilterValues>({
        search: '',
        status: '',
        resolvedBy: ''
    });

    // Enquiry data and pagination state
    const [enquiryData, setEnquiryData] = useState<EnquiryData[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEnquiries, setTotalEnquiries] = useState(0);
    const [sortState, setSortState] = useState<{ key: string | null; direction: "asc" | "desc" }>({
        key: null,
        direction: "asc"
    });

    // Authentication check
    useEffect(() => {
        const checkAuthentication = () => {
            if (!AuthManager.isAuthenticated()) {
                navigate('/login');
                return;
            }
        };

        checkAuthentication();
    }, [navigate]);

    // Fetch enquiry stats cards
    const fetchEnquiryCards = useCallback(async () => {
        setCardLoading(true);

        try {
            const apiResponse = await ApiClient.get('/stats/enquiry') as EnquiryStatsResponse;
            if (apiResponse.success && apiResponse.data) {
                setCards(apiResponse.data.cards || []);
                setLastUpdated(apiResponse.data.lastUpdated);
            } else {
                setCards([]);
                notification.showError(apiResponse.error || "Failed to fetch enquiry cards", apiResponse.message || "Contact support", 5000);
            }

        } catch (error) {
            notification.showError('Error fetching enquiry cards', error instanceof Error ? error.message : "Contact support", 5000);
            setCards([]);
        } finally {
            setCardLoading(false);
        }
    }, [notification]);

    // fetch filters
    const fetchFilters = useCallback(async () => {
        setFilterLoading(true);

        try {
            const apiResponse = await ApiClient.get('/filters/enquiry') as EnquiryFiltersResponse;
            if (apiResponse.success && apiResponse.data) {
                setFilters(apiResponse.data.filters);
            } else {
                notification.showError(apiResponse.error || "Failed to fetch filters", apiResponse.message || "Contact support", 5000);
            }

        } catch (error) {
            notification.showError('Error fetching filters', error instanceof Error ? error.message : "Contact support", 5000);
        } finally {
            setFilterLoading(false);
        }
    }, [notification]);

    // fetch enquiry data with pagination and filters
    const fetchEnquiryData = useCallback(async (page: number, filterParams: FilterValues, sortKey: string | null = null, sortDirection: "asc" | "desc" = "asc") => {
        setDataLoading(true);
        try {
            const queryString = buildEnquiryQueryParams(
                page,
                {
                    search: filterParams.search,
                    status: filterParams.status,
                    resolvedBy: filterParams.resolvedBy,
                },
                sortKey,
                sortDirection,
                10
            );

            const endpoint = `/enquiry${queryString ? `?${queryString}` : ''}`;
            const apiResponse = await ApiClient.get(endpoint) as EnquiryDataResponse;

            if (apiResponse.success && apiResponse.data) {
                setEnquiryData(apiResponse.data.enquiries);
                setCurrentPage(apiResponse.data.pagination?.page || page);
                setTotalPages(apiResponse.data.pagination?.totalPages || 1);
                setTotalEnquiries(apiResponse.data.pagination?.total || 0);
            } else {
                setEnquiryData([]);
                setTotalPages(1);
                setTotalEnquiries(0);
                notification.showError(apiResponse.error || "Failed to fetch enquiry data", apiResponse.message || "Contact support", 5000);
            }

        } catch (error) {
            notification.showError('Error fetching enquiry data', error instanceof Error ? error.message : "Contact support", 5000);
            setEnquiryData([]);
            setTotalPages(1);
            setTotalEnquiries(0);
        } finally {
            setDataLoading(false);
        }
    }, [notification]);

    // Filter handlers - auto-apply filters on change
    const handleFilterChange = useCallback((id: string, value: string | string[] | number | boolean | Date | { start: string; end: string } | null) => {
        const newFilterValues = { ...filterValues, [id]: value as string };
        setFilterValues(newFilterValues);
        
        // Auto-apply filters when any filter changes
        setCurrentPage(1);
        fetchEnquiryData(1, newFilterValues, sortState.key, sortState.direction);
    }, [filterValues, sortState.key, sortState.direction, fetchEnquiryData]);

    const handleResetFilters = () => {
        const resetFilters: FilterValues = { search: '', status: '', resolvedBy: '' };
        setFilterValues(resetFilters);
        setCurrentPage(1);
        fetchEnquiryData(1, resetFilters, sortState.key, sortState.direction);
    };

    // Pagination handler
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchEnquiryData(page, filterValues, sortState.key, sortState.direction);
    };

    // Sort handler
    const handleSort = (key: string, direction: "asc" | "desc") => {
        setSortState({ key, direction });
        fetchEnquiryData(currentPage, filterValues, key, direction);
    };

    // table columns
    const enquiryTableColumns: types["TableColumn"][] = [
        {
            key: 'name',
            label: "Name",
            align: "left",
            sortable: true,
            width: "15%",
        },
        {
            key: 'phone',
            label: "Phone No",
            align: "left",
            sortable: false,
            width: "15%",
        },
        {
            key: 'message',
            label: "Message",
            align: "left",
            sortable: false,
            width: "20%",
            render: (value: unknown) => (
                <div className="message-cell" title={value as string}>
                    {(value as string).length > 100
                        ? `${(value as string).substring(0, 100)}...`
                        : value as string
                    }
                </div>
            )
        },
        {
            key: 'status',
            label: "Status",
            align: "center",
            sortable: true,
            width: "15%",
            render: (value: unknown) => (
                <span className={`status-badge status-badge--${(value as string).toLowerCase().replace('_', '-')}`}>
                    {(value as string).replace('_', ' ')}
                </span>
            )
        },
        {
            key: 'resolvedBy',
            label: "Resolved By",
            align: "center",
            sortable: false,
            width: "15%",
            render: (_, row: unknown) => {
                const enquiry = row as EnquiryData;
                return enquiry.resolver ? (
                    <span className="resolver-name">{enquiry.resolver.name}</span>
                ) : (
                    <span className="not-resolved">-</span>
                );
            }
        },
        {
            key: 'resolvedAt',
            label: "Resolved At",
            align: "center",
            sortable: true,
            width: "15%",
            render: (value: unknown) => {
                return value ? (
                    <span className="resolved-date">
                        {new Date(value as string).toLocaleDateString('en-IN')}
                    </span>
                ) : (
                    <span className="not-resolved">-</span>
                );
            }
        },
        {
            key: 'action',
            label: "Action",
            align: "center",
            sortable: false,
            width: "15%",
            render: (_value: unknown, row: unknown) => {
                const enquiry = row as EnquiryData;
                return (
                    <div className="action-buttons">
                        {enquiry.status === 'NOT_RESOLVED' ? (
                            <>
                                <ui.Button
                                    variant="success"
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleResolveEnquiry(enquiry.id);
                                    }}
                                    className="resolve-btn"
                                    title="Mark as resolved"
                                >
                                    <ui.Icons name="check" size={14} />
                                </ui.Button>
                                <ui.Button
                                    variant="danger"
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteEnquiry(enquiry.id, enquiry.name);
                                    }}
                                    className="delete-btn"
                                    title="Delete enquiry"
                                >
                                    <ui.Icons name="trash" size={14} />
                                </ui.Button>
                            </>
                        ) : (
                            <>
                                <span className="resolved-icon" title="Resolved">
                                    <ui.Icons name="checkCircle2" size={16} />
                                </span>
                                <ui.Button
                                    variant="danger"
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteEnquiry(enquiry.id, enquiry.name);
                                    }}
                                    className="delete-btn"
                                    title="Delete enquiry"
                                >
                                    <ui.Icons name="trash" size={14} />
                                </ui.Button>
                            </>
                        )}
                    </div>
                );
            }
        }
    ];

    // Handle resolve enquiry
    const handleResolveEnquiry = async (enquiryId: string) => {
        try {
            const apiResponse = await ApiClient.patch(`/enquiry/${enquiryId}/resolve`, {}) as { success: boolean; message?: string; error?: string };

            if (apiResponse.success) {
                notification.showSuccess('Enquiry resolved', 'The enquiry has been marked as resolved.', 3000);
                fetchEnquiryData(currentPage, filterValues, sortState.key, sortState.direction);
                fetchEnquiryCards();
            } else {
                notification.showError(apiResponse.error || 'Failed to resolve enquiry', apiResponse.message || 'Please try again.', 5000);
            }
        } catch (error) {
            notification.showError('Error resolving enquiry', error instanceof Error ? error.message : "Contact support", 5000);
        }
    };

    // Handle delete enquiry
    const handleDeleteEnquiry = async (enquiryId: string, enquiryName: string) => {

        try {
            const apiResponse = await ApiClient.delete(`/enquiry/${enquiryId}`) as { success: boolean; message?: string; error?: string };

            if (apiResponse.success) {
                notification.showSuccess('Enquiry deleted', `The enquiry from "${enquiryName}" has been deleted successfully.`, 3000);
                // Refresh data
                fetchEnquiryData(currentPage, filterValues, sortState.key, sortState.direction);
                fetchEnquiryCards(); // Refresh stats
            } else {
                notification.showError(apiResponse.error || 'Failed to delete enquiry', apiResponse.message || 'Please try again.', 5000);
            }
        } catch (error) {
            notification.showError('Error deleting enquiry', error instanceof Error ? error.message : "Contact support", 5000);
        }
    };

    // Initial data loading - only runs once when component mounts
    useEffect(() => {
        if (AuthManager.isAuthenticated() && isInitialLoad.current) {
            fetchEnquiryCards();
            fetchFilters();
            fetchEnquiryData(1, filterValues, null, "asc");
            isInitialLoad.current = false;
        }
    }, [fetchEnquiryCards, fetchFilters, fetchEnquiryData, filterValues]);


    return (
        <div className="enquiry-page">
            <div className="enquiry-page__header">
                <layouts.HeaderLayout
                    title="Enquiry Management System"
                    subText="Manage user feedback and enquiries"
                />
            </div>
            <div className="enquiry-page__content">
                <div className="enquiry-page__cards">
                    <layouts.CardGrid
                        cards={cards ? cards : [{ icon: "clock" }, { icon: "clock" }, { icon: "clock" }, { icon: "clock" }]}
                        loading={cardLoading}
                        columns={4}
                        gap='md'
                        showRefresh
                        onRefresh={fetchEnquiryCards}
                        lastUpdated={lastUpdated}
                        className='enquiry-cards'
                    />
                </div>

                <div className="enquiry-page__filter-section">
                    <layouts.FilterLayout
                        loading={filterLoading}
                        filters={filters}
                        columns={3}
                        showResetButton
                        onReset={handleResetFilters}
                        onChange={handleFilterChange}
                        className="enquiry-filters"
                        collapsible={true}
                    />
                </div>

                <div className="enquiry-page__table-section">
                    <layouts.TableLayout
                        columns={enquiryTableColumns}
                        data={enquiryData}
                        loading={dataLoading}
                        pagination={{
                            currentPage: currentPage,
                            totalPages: totalPages,
                            totalItems: totalEnquiries,
                            onPageChange: handlePageChange
                        }}
                        pageSize={10}
                        currentSort={sortState}
                        onSort={handleSort}
                        emptyMessage="No enquiries found"
                        showRefresh={true}
                        refreshLoading={dataLoading}
                        onRefresh={() => fetchEnquiryData(currentPage, filterValues, sortState.key, sortState.direction)}
                        className="enquiry-table"
                    />
                </div>
            </div>
        </div>
    );
};

export default EnquiryPage;