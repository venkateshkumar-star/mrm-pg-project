/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import layouts from "@layouts/index";
import ui from "@/components/ui";
import './ExpensePage.scss';
import { AuthManager, ApiClient } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '@/hooks/useNotification';
import type { CardItem, ExpenseStatsResponse, ExpenseTableResponse, ExpenseEntry } from '@/types/apiResponseTypes';
import type { CashEntryFormData, CashEntryType } from '@/components/ui/CashEntryForm/CashEntryForm';

const ExpensePage = (): React.ReactElement => {
    const navigate = useNavigate();
    const notification = useNotification();
    const isInitialLoad = useRef(true);

    // Loading states
    const [cardLoading, setCardLoading] = useState(false);

    // Cards state
    const [cards, setCards] = useState<CardItem[]>([]);
    const [lastUpdated, setLastUpdated] = useState<Date | string | undefined>(undefined);

    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formType, setFormType] = useState<CashEntryType>('CASH_IN');

    // Modal state
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<ExpenseEntry | null>(null);

    // Table state
    const [tableData, setTableData] = useState<ExpenseEntry[]>([]);
    const [isTableLoading, setIsTableLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);
    const [pageSize] = useState(10); // Fixed page size

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

    // Authentication check and staff data extraction
    useEffect(() => {
        const checkAuthentication = () => {
            if (!AuthManager.isAuthenticated()) {
                navigate('/login');
                return;
            }
        };

        checkAuthentication();
    }, [navigate]);

    // Fetch expense statistics from backend
    const fetchExpenseStats = useCallback(async () => {
        setCardLoading(true);
        try {
            const apiResponse = await ApiClient.get('/stats/expenses') as ExpenseStatsResponse;
            if (apiResponse.success && apiResponse.data) {
                setCards(apiResponse.data.cards || []);
                setLastUpdated(apiResponse.data.lastUpdated);
            } else {
                setCards([]);
                notification.showError(
                    apiResponse.message || 'Failed to fetch expense statistics',
                    apiResponse.error || "Contact support",
                    5000
                );
            }
        } catch (error) {
            notification.showError(
                'Error fetching expense statistics',
                error instanceof Error ? error.message : "Contact support",
                5000
            );
            setCards([]);
        } finally {
            setCardLoading(false);
        }
    }, [notification]);

    // Fetch expense table data from backend
    const fetchExpenseTableData = useCallback(async (page: number = 1) => {
        setIsTableLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: pageSize.toString()
            });

            const apiResponse = await ApiClient.get(`/expenses?${queryParams}`) as ExpenseTableResponse;
            if (apiResponse.success && apiResponse.data) {
                setTableData(apiResponse.data || []);
                setCurrentPage(apiResponse.pagination.page);
                setTotalPages(apiResponse.pagination.totalPages);
                setTotalEntries(apiResponse.pagination.totalPages);
            } else {
                setTableData([]);
                notification.showError(
                    apiResponse.message || 'Failed to fetch expense table data',
                    apiResponse.error || "Contact support",
                    5000
                );
            }
        } catch (error) {
            notification.showError(
                'Error fetching expense table data',
                error instanceof Error ? error.message : "Contact support",
                5000
            );
            setTableData([]);
        } finally {
            setIsTableLoading(false);
        }
    }, [notification, pageSize]);

    // Form handling functions
    const openForm = (type: CashEntryType) => {
        setFormType(type);
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
    };

    // Helper function to submit cash entry data
    const submitCashEntry = async (data: CashEntryFormData): Promise<any> => {
        // Create FormData for file upload
        const formData = new FormData();

        // Append form fields
        formData.append('date', data.date);
        formData.append('amount', data.amount);
        formData.append('entryType', data.type);
        formData.append('partyName', data.partyName);
        formData.append('pgId', data.pgId);
        formData.append('remarks', data.remarks);
        formData.append('paymentType', data.paymentType);

        // Append files if any
        if (data.attachments && data.attachments.length > 0) {
            data.attachments.forEach((file) => {
                formData.append('bills', file);
            });
        }

        // Use ApiClient postFormData method for authenticated multipart request
        const result = await ApiClient.postFormData('/expenses', formData) as any;

        if (!result.success) {
            throw new Error(result.message || 'Failed to save cash entry');
        }

        return result;
    };

    const handleFormSave = async (data: CashEntryFormData) => {
        try {
            await submitCashEntry(data);

            notification.showSuccess(
                `${data.type === 'CASH_IN' ? 'Cash In' : 'Cash Out'} entry saved successfully`,
                'Entry has been recorded',
                3000
            );
            closeForm();
            // Refresh both stats and table data
            fetchExpenseStats();
            fetchExpenseTableData(currentPage);
        } catch (error) {
            console.error('Error saving cash entry:', error);
            notification.showError(
                'Failed to save cash entry',
                error instanceof Error ? error.message : 'Please try again',
                5000
            );
        }
    };

    const handleFormSaveAndAddNew = async (data: CashEntryFormData) => {
        try {
            await submitCashEntry(data);

            notification.showSuccess(
                `${data.type === 'CASH_IN' ? 'Cash In' : 'Cash Out'} entry saved successfully`,
                'Ready for next entry',
                3000
            );
            // Don't close the form, just refresh data
            fetchExpenseStats();
            fetchExpenseTableData(currentPage);
        } catch (error) {
            console.error('Error saving cash entry:', error);
            notification.showError(
                'Failed to save cash entry',
                error instanceof Error ? error.message : 'Please try again',
                5000
            );
        }
    };

    // Initial data loading - only runs once when component mounts
    useEffect(() => {
        if (AuthManager.isAuthenticated() && isInitialLoad.current) {
            fetchExpenseStats();
            fetchExpenseTableData(1); // Load first page
            isInitialLoad.current = false;
        }
    }, [fetchExpenseStats, fetchExpenseTableData]);

    // Handle page changes
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchExpenseTableData(page);
    };

    // Table columns configuration
    const tableColumns = [
        {
            key: 'entryType',
            label: 'Type',
            width: '100px',
            align: 'center' as const,
            className: 'type-column',
            render: (_: unknown, row: Record<string, unknown>) => {
                const entry = row as unknown as ExpenseEntry;
                return (
                    <span className={`status-badge status-badge--${entry.entryType === 'CASH_IN' ? 'active' : 'inactive'}`}>
                        {entry.entryType === 'CASH_IN' ? 'Cash In' : 'Cash Out'}
                    </span>
                );
            }
        },
        {
            key: 'amount',
            label: 'Amount',
            width: '120px',
            align: 'center' as const,
            className: 'amount-column',
            render: (_: unknown, row: Record<string, unknown>) => {
                const entry = row as unknown as ExpenseEntry;
                return (
                    <span className={`amount ${entry.entryType === 'CASH_IN' ? 'amount--positive' : 'amount--negative'}`}>
                        ₹{entry.amount.toLocaleString()}
                    </span>
                );
            },
        },
        {
            key: 'date',
            label: 'Date',
            width: '110px',
            align: 'center' as const,
            className: 'date-column',
            render: (_: unknown, row: Record<string, unknown>) => {
                const entry = row as unknown as ExpenseEntry;
                return new Date(entry.date).toLocaleDateString();
            }
        },
        {
            key: 'partyName',
            label: 'Party Name',
            width: '150px',
            align: 'left' as const,
            className: 'party-column',
            render: (_: unknown, row: Record<string, unknown>) => {
                const entry = row as unknown as ExpenseEntry;
                return (
                    <span className="party-name" title={entry.partyName || '-'}>
                        {entry.partyName || '-'}
                    </span>
                );
            }
        },
        {
            key: 'adminName',
            label: 'Admin',
            width: '120px',
            align: 'left' as const,
            className: 'admin-column',
            render: (_: unknown, row: Record<string, unknown>) => {
                const entry = row as unknown as ExpenseEntry;
                return (
                    <span className="admin-name" title={entry.adminName || '-'}>
                        {entry.adminName || '-'}
                    </span>
                );
            }
        },
        {
            key: 'pgName',
            label: 'PG',
            width: '130px',
            align: 'left' as const,
            className: 'pg-column',
            render: (_: unknown, row: Record<string, unknown>) => {
                const entry = row as unknown as ExpenseEntry;
                return (
                    <span className="pg-name" title={entry.pgName || '-'}>
                        {entry.pgName || '-'}
                    </span>
                );
            }
        },
        {
            key: 'actions',
            label: 'Actions',
            width: '80px',
            align: 'center' as const,
            className: 'actions-column',
            render: (_: unknown, row: Record<string, unknown>) => {
                const entry = row as unknown as ExpenseEntry;
                return (
                    <div className="table-actions">
                        <ui.Button variant='transparent'
                            size='small'
                            className="action-btn action-btn--view"
                            onClick={() => handleViewExpense(entry)}
                            title="View Details"
                        >
                            <ui.Icons name="eye" size={16} />
                        </ui.Button>
                    </div>
                );
            }
        }
    ];

    // Table action handlers
    const handleViewExpense = (expense: ExpenseEntry) => {
        setSelectedExpense(expense);
        setIsViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedExpense(null);
    };

    return (
        <>
            <div className="expense-page">
                <div className="expense-page__header">
                    <layouts.HeaderLayout
                        title="Expense Management"
                        subText="Track and manage all PG related expenses, categories, and financial records"
                        buttons={[
                            {
                                label: "Cash In",
                                variant: "primary",
                                icon: "plus",
                                size: "small",
                                onClick: () => openForm('CASH_IN')
                            },
                            {
                                label: "Cash Out",
                                variant: "secondary",
                                icon: "minus",
                                size: "small",
                                onClick: () => openForm('CASH_OUT')
                            },
                        ]}
                    />
                </div>

                <div className="expense-page__content">
                    {/* Cards Section */}
                    <div className="expense-page__stats-section">
                        <layouts.CardGrid
                            cards={cards.length > 0 ? cards : [
                                { icon: "clock" },
                                { icon: "clock" },
                                { icon: "clock" },
                                { icon: "clock" }
                            ]}
                            loading={cardLoading}
                            columns={4}
                            gap='md'
                            showRefresh
                            onRefresh={fetchExpenseStats}
                            lastUpdated={lastUpdated}
                            className='expense-cards'
                        />
                    </div>

                    {/* Table Section */}
                    <div className="expense-page__table-section">
                        <layouts.TableLayout
                            columns={tableColumns}
                            data={tableData as unknown as Record<string, unknown>[]}
                            loading={isTableLoading}
                            sortable={false}
                            pagination={{
                                currentPage: currentPage,
                                totalPages: totalPages,
                                totalItems: totalEntries,
                                onPageChange: handlePageChange
                            }}
                            emptyMessage="No expense records found"
                        />
                    </div>
                </div>
            </div>

            {/* Cash Entry Form */}
            <ui.CashEntryForm
                isOpen={isFormOpen}
                onClose={closeForm}
                onSave={handleFormSave}
                onSaveAndAddNew={handleFormSaveAndAddNew}
                initialType={formType}
            />

            {/* Expense View Modal */}
            <layouts.ExpenseViewModal
                isOpen={isViewModalOpen}
                onClose={handleCloseViewModal}
                expense={selectedExpense}
            />
        </>
    );
};

export default ExpensePage;