import React from "react";
import "./TableLayout.scss";
import ui from "@/components/ui";
import type { types } from "@/types";

const TableLayout: React.FC<types["TableLayoutProps"]> = ({
    columns,
    data,
    loading = false,
    pagination = {
        currentPage: 1,
        totalItems: 1,
        totalPages: 1,
        onPageChange: () => { }
    },
    pageSize = 10,
    sortable = true,
    currentSort = { key: null, direction: "asc" },
    className = "",
    onRowClick,
    onSort,
    emptyMessage = "No data available",
    showCheckboxes = false,
    selectedRows = [],
    onSelectionChange,
    rowIdField = "id",
    showRefresh = false,
    showLastUpdated = false,
    lastUpdated,
    onRefresh,
    refreshLoading = false
}) => {

    // Format last updated timestamp
    const formatLastUpdated = (timestamp: Date | string) => {
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) {
            return "Just now";
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
        } else if (diffInMinutes < 1440) {
            const hours = Math.floor(diffInMinutes / 60);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    };

    const getRowId = (row: types["TableData"]) => {
        return row[rowIdField] as string | number;
    };

    const isRowSelected = (row: types["TableData"]) => {
        const rowId = getRowId(row);
        return selectedRows.includes(rowId);
    };

    const isAllCurrentPageSelected = () => {
        if (!showCheckboxes || data.length === 0) return false;
        return data.every(row => isRowSelected(row));
    };

    const handleSelectAll = () => {
        if (!onSelectionChange) return;

        const currentPageIds = data.map(getRowId);
        let newSelectedRows: (string | number)[];

        if (isAllCurrentPageSelected()) {
            newSelectedRows = selectedRows.filter(id => !currentPageIds.includes(id));
        } else {
            newSelectedRows = [...new Set([...selectedRows, ...currentPageIds])];
        }

        const selectedRowData = data.filter(row => newSelectedRows.includes(getRowId(row)));
        onSelectionChange(newSelectedRows, selectedRowData);
    };

    const handleRowSelect = (row: types["TableData"]) => {
        if (!onSelectionChange) return;

        const rowId = getRowId(row);
        let newSelectedRows: (string | number)[];

        if (isRowSelected(row)) {
            newSelectedRows = selectedRows.filter(id => id !== rowId);
        } else {
            newSelectedRows = [...selectedRows, rowId];
        }

        const selectedRowData = data.filter(row => newSelectedRows.includes(getRowId(row)));
        onSelectionChange(newSelectedRows, selectedRowData);
    };

    const handleSort = (columnKey: string) => {
        if (!sortable || !onSort) return;

        const column = columns.find(col => col.key === columnKey);
        if (!column?.sortable) return;

        // Toggle direction based on current sort state
        const newDirection =
            currentSort.key === columnKey && currentSort.direction === "asc"
                ? "desc"
                : "asc";

        onSort(columnKey, newDirection);
    };

    const handlePageChange = (page: number) => {
        pagination.onPageChange(page);
    };

    const renderCell = (column: types["TableColumn"], row: types["TableData"], rowIndex: number): React.ReactNode => {
        const value = row[column.key];

        if (column.render) {
            return column.render(value, row, rowIndex);
        }

        if (value === null || value === undefined) {
            return "-";
        }

        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            return String(value);
        }

        return String(value);
    };

    const renderPagination = () => {
        if (!pagination || pagination.totalPages <= 1) return null;

        const getVisiblePages = () => {
            const delta = 2;
            const range: number[] = [];
            const rangeWithDots: (number | string)[] = [];

            for (let i = Math.max(2, pagination.currentPage - delta);
                i <= Math.min(pagination.totalPages - 1, pagination.currentPage + delta);
                i++) {
                range.push(i);
            }

            if (pagination.currentPage - delta > 2) {
                rangeWithDots.push(1, '...');
            } else {
                rangeWithDots.push(1);
            }

            rangeWithDots.push(...range);

            if (pagination.currentPage + delta < pagination.totalPages - 1) {
                rangeWithDots.push('...', pagination.totalPages);
            } else {
                rangeWithDots.push(pagination.totalPages);
            }

            return rangeWithDots;
        };

        return (
            <div className="table-pagination">
                <div className="pagination-info">
                    <span>
                        Showing {((pagination.currentPage - 1) * pageSize) + 1} to {Math.min(pagination.currentPage * pageSize, pagination.totalItems)} of {pagination.totalItems} entries
                    </span>
                </div>
                <div className="pagination-controls">
                    <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                    >
                        <ui.Icons name="chevronLeft" size={16} strokeWidth={3} />
                    </button>

                    {getVisiblePages().map((page, index) => (
                        <button
                            key={index}
                            className={`pagination-btn ${page === pagination.currentPage ? 'active' : ''} ${page === '...' ? 'dots' : ''}`}
                            onClick={() => typeof page === 'number' && handlePageChange(page)}
                            disabled={page === '...'}
                        >
                            {page}
                        </button>
                    ))}

                    <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                    >
                        <ui.Icons name="chevronRight" size={16} strokeWidth={3} />
                    </button>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className={`table-layout ${className}`}>
                {showRefresh && (
                    <div className={`table-header __${showLastUpdated && lastUpdated ? 'with-timestamp' : 'no-timestamp'}`}>
                        {showLastUpdated && lastUpdated && (<div className="last-updated">
                            <ui.Icons name="clock" size={16} />
                            <span className="timestamp">
                                {lastUpdated ? `Last updated: ${formatLastUpdated(lastUpdated)}` : 'Never updated'}
                            </span>
                        </div>)}
                        <div className="refresh-section">
                            <ui.Button
                                variant="outline"
                                size="small"
                                onClick={onRefresh}
                                disabled={refreshLoading || loading}
                                leftIcon={<ui.Icons name={refreshLoading ? "loader" : "refresh"} size={16} className={refreshLoading ? "animate-spin" : ""} />}
                                iconOnlyOnMobile={true}
                            >
                                {refreshLoading ? "Refreshing..." : "Refresh"}
                            </ui.Button>
                        </div>
                    </div>
                )}

                <div className="table-loading">
                    <ui.Icons name="refresh" size={24} className="loading-spinner" />
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`table-layout ${className}`}>
            {showRefresh && (
                <div className={`table-header __${showLastUpdated && lastUpdated ? 'with-timestamp' : 'no-timestamp'}`}>
                    {showLastUpdated && lastUpdated && (<div className="last-updated">
                        <ui.Icons name="clock" size={16} />
                        <span className="timestamp">
                            {lastUpdated ? `Last updated: ${formatLastUpdated(lastUpdated)}` : 'Never updated'}
                        </span>
                    </div>)}
                    <div className="refresh-section">
                        <ui.Button
                            variant="outline"
                            size="small"
                            onClick={onRefresh}
                            disabled={refreshLoading || loading}
                            leftIcon={<ui.Icons name={refreshLoading ? "loader" : "refresh"} size={16} className={refreshLoading ? "animate-spin" : ""} />}
                            iconOnlyOnMobile={true}
                        >
                            {refreshLoading ? "Refreshing..." : "Refresh"}
                        </ui.Button>
                        {}
                    </div>
                </div>
            )}

            <div className="table-container">
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                {showCheckboxes && (
                                    <th className="checkbox-column">
                                        <ui.Checkbox
                                            id="select-all"
                                            checked={isAllCurrentPageSelected()}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                )}
                                {columns.map((column) => (
                                    <th
                                        key={column.key}
                                        className={`
                      ${column.align ? `text-${column.align}` : 'text-left'}
                      ${column.sortable && sortable ? 'sortable' : ''}
                      ${currentSort.key === column.key ? 'sorted' : ''}
                    `}
                                        style={{ width: column.width }}
                                        onClick={() => handleSort(column.key)}
                                    >
                                        <div className="th-content">
                                            <span>{column.label}</span>
                                            {column.sortable && sortable && (
                                                <div className="sort-icons">
                                                    <ui.Icons
                                                        name={
                                                            currentSort.key === column.key
                                                                ? currentSort.direction === "asc"
                                                                    ? "chevronUp"
                                                                    : "chevronDown"
                                                                : "chevronDown"
                                                        }
                                                        size={14}
                                                        strokeWidth={3}
                                                        className={`sort-icon ${currentSort.key === column.key ? 'active' : ''}`}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + (showCheckboxes ? 1 : 0)} className="empty-state">
                                        <div className="empty-content">
                                            <ui.Icons name="file" size={48} className="empty-icon" />
                                            <p>{emptyMessage}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data.map((row, rowIndex) => (
                                    <tr
                                        key={rowIndex}
                                        className={onRowClick ? 'clickable' : ''}
                                        onClick={() => onRowClick?.(row, rowIndex)}
                                    >
                                        {showCheckboxes && (
                                            <td
                                                className="checkbox-column"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRowSelect(row);
                                                }}
                                            >
                                                <ui.Checkbox
                                                    id={`select-row-${getRowId(row)}`}
                                                    checked={isRowSelected(row)}
                                                    onChange={() => handleRowSelect(row)}
                                                />
                                            </td>
                                        )}
                                        {columns.map((column) => (
                                            <td
                                                key={`${rowIndex}-${column.key}`}
                                                className={`
                                                    ${column.align ? `text-${column.align}` : 'text-left'} 
                                                    ${column.className || ''} 
                                                    ${column.key === 'action' || column.key === 'screenshot' ? 'action-column' : ''}
                                                `.trim()}
                                                style={column.style}
                                            >
                                                {renderCell(column, row, rowIndex)}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {renderPagination()}
        </div>
    );
};

export default TableLayout;