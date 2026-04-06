import React, { useState, useCallback, useEffect, useRef } from "react";
import type { types } from "@/types";
import ui from "@/components/ui";
import "./FilterLayout.scss";

type FilterValue = string | string[] | number | boolean | Date | { start: string; end: string } | null;

const FilterLayout = ({
    title,
    filters,
    layout = "grid",
    columns = 1,
    spacing = "medium",
    showResetButton = false,
    onReset,
    onChange,
    className = "",
    collapsible = false,
    defaultCollapsed = false,
    downloadReport = false,
    loading = false,
    onDownloadReport
}: types["FilterLayoutProps"]): React.ReactElement => {
    const isInitialized = useRef(false);

    const [filterValues, setFilterValues] = useState<Record<string, FilterValue>>({});
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
    const [errors, setErrors] = useState<Record<string, string>>({});


    useEffect(() => {
        if (filters.length === 0) return;

        setFilterValues(prevValues => {
            const newValues: Record<string, FilterValue> = { ...prevValues };
            let hasChanges = false;

            filters.forEach(filter => {

                if (!(filter.id in prevValues) ||
                    ((prevValues[filter.id] === null || prevValues[filter.id] === undefined || prevValues[filter.id] === '')
                        && filter.defaultValue !== undefined && filter.defaultValue !== null)) {
                    newValues[filter.id] = filter.defaultValue || null;
                    hasChanges = true;
                }
            });

            Object.keys(prevValues).forEach(key => {
                if (!filters.find(f => f.id === key)) {
                    delete newValues[key];
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                return newValues;
            }

            return prevValues;
        });

        isInitialized.current = true;
    }, [filters]);

    const handleFilterChange = useCallback((id: string, value: FilterValue) => {
        setFilterValues(prev => ({ ...prev, [id]: value }));

        if (errors[id]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[id];
                return newErrors;
            });
        }

        // Use the parent onChange function if provided
        if (onChange) {
            onChange(id, value);
        }
    }, [onChange, errors]);

    const handleReset = useCallback(() => {
        const resetValues: Record<string, FilterValue> = {};
        filters.forEach(filter => {
            resetValues[filter.id] = filter.defaultValue || null;
        });
        setFilterValues(resetValues);
        setErrors({});
        onReset?.();
    }, [filters, onReset]);

    const renderFilterItem = (filter: types["FilterItemProps"]) => {
        const value = filterValues[filter.id];
        const error = errors[filter.id];

        const getGridSpan = () => {
            if (filter.fullWidth) return columns;
            if (filter.gridSpan) return Math.min(filter.gridSpan, columns);
            return 1;
        };

        const gridSpan = layout === "grid" ? getGridSpan() : 1;

        // For responsive grids, ensure full-width items span correctly at different breakpoints
        const getResponsiveGridSpan = () => {
            if (filter.fullWidth) return "1 / -1"; // Always span full width
            return `span ${gridSpan}`;
        };

        const itemStyle = layout === "grid" ? {
            gridColumn: getResponsiveGridSpan()
        } : {};

        switch (filter.type) {
            case "text":
            case "search":
                return (
                    <div key={filter.id} className="filter-item" style={itemStyle}>
                        {filter.label && <ui.Label>{filter.label}</ui.Label>}
                        <ui.Search
                            id={filter.id}
                            value={(value as string) || ""}
                            placeholder={filter.placeholder}
                            disabled={filter.disabled}
                            className={filter.className}
                            style={filter.style}
                            onChange={(val) => handleFilterChange(filter.id, val)}
                        />
                        {error && <span className="filter-error">{error}</span>}
                    </div>
                );

            case "number":
                return (
                    <div key={filter.id} className="filter-item" style={itemStyle}>
                        {filter.label && <ui.Label>{filter.label}</ui.Label>}
                        <ui.NumberInput
                            id={filter.id}
                            value={(value as number) || 0}
                            placeholder={filter.placeholder}
                            disabled={filter.disabled}
                            className={filter.className}
                            style={filter.style}
                            min={filter.min as number}
                            max={filter.max as number}
                            step={filter.step}
                            onChange={(val) => handleFilterChange(filter.id, val)}
                        />
                        {error && <span className="filter-error">{error}</span>}
                    </div>
                );

            case "date":
                return (
                    <div key={filter.id} className="filter-item" style={itemStyle}>
                        {filter.label && <ui.Label>{filter.label}</ui.Label>}
                        <ui.DateInput
                            id={filter.id}
                            value={(value as string) || ""}
                            disabled={filter.disabled}
                            className={filter.className}
                            style={filter.style}
                            min={filter.min as string}
                            max={filter.max as string}
                            onChange={(val) => handleFilterChange(filter.id, val)}
                        />
                        {error && <span className="filter-error">{error}</span>}
                    </div>
                );

            case "dateRange": {
                const dateRangeValue = value as { start: string; end: string } | null;
                return (
                    <div key={filter.id} className="filter-item filter-item--date-range" style={itemStyle}>
                        {filter.label && <ui.Label>{filter.label}</ui.Label>}
                        <div className="date-range-inputs">
                            <ui.DateInput
                                id={`${filter.id}-start`}
                                value={dateRangeValue?.start || ""}
                                disabled={filter.disabled}
                                className={`${filter.className || ""} date-range-start`}
                                min={filter.min as string}
                                max={dateRangeValue?.end || filter.max as string}
                                onChange={(startDate) => {
                                    const newValue = {
                                        start: startDate,
                                        end: dateRangeValue?.end || ""
                                    };
                                    handleFilterChange(filter.id, newValue);
                                }}
                            />
                            <span className="date-range-separator">to</span>
                            <ui.DateInput
                                id={`${filter.id}-end`}
                                value={dateRangeValue?.end || ""}
                                disabled={filter.disabled}
                                className={`${filter.className || ""} date-range-end`}
                                min={dateRangeValue?.start || filter.min as string}
                                max={filter.max as string}
                                onChange={(endDate) => {
                                    const newValue = {
                                        start: dateRangeValue?.start || "",
                                        end: endDate
                                    };
                                    handleFilterChange(filter.id, newValue);
                                }}
                            />
                        </div>
                        {error && <span className="filter-error">{error}</span>}
                    </div>
                );
            }

            case "select":
                return (
                    <div key={filter.id} className="filter-item" style={itemStyle}>
                        {filter.label && <ui.Label>{filter.label}</ui.Label>}
                        <ui.Select
                            id={filter.id}
                            value={(value as string) || ""}
                            placeholder={filter.placeholder}
                            options={filter.options || []}
                            disabled={filter.disabled}
                            className={filter.className}
                            style={filter.style}
                            onChange={(val) => handleFilterChange(filter.id, val)}
                            onFocus={filter.onFocus}
                            onBlur={filter.onBlur}
                            searchable={filter.searchable}
                            variant={(filter.variant === "native" || filter.variant === "custom") ? filter.variant : "custom"}
                        />
                        {error && <span className="filter-error">{error}</span>}
                    </div>
                );

            case "multiSelect":
                return (
                    <div key={filter.id} className="filter-item" style={itemStyle}>
                        {filter.label && <ui.Label>{filter.label}</ui.Label>}
                        <ui.MultiSelect
                            id={filter.id}
                            value={(value as string[]) || []}
                            options={filter.options || []}
                            disabled={filter.disabled}
                            className={filter.className}
                            style={filter.style}
                            onChange={(val: string[]) => handleFilterChange(filter.id, val)}
                            onFocus={filter.onFocus}
                            onBlur={filter.onBlur}
                            variant={(filter.variant === "list" || filter.variant === "dropdown") ? filter.variant : "dropdown"}
                            placeholder={filter.placeholder}
                            searchable={filter.searchable}
                            maxDisplayItems={filter.maxDisplayItems}
                            showSelectAll={filter.showSelectAll}
                        />
                        {error && <span className="filter-error">{error}</span>}
                    </div>
                );

            case "checkbox":
                return (
                    <div key={filter.id} className="filter-item" style={itemStyle}>
                        <ui.Checkbox
                            id={filter.id}
                            checked={(value as boolean) || false}
                            label={filter.label}
                            disabled={filter.disabled}
                            className={filter.className}
                            style={filter.style}
                            onChange={(val) => handleFilterChange(filter.id, val)}
                        />
                        {error && <span className="filter-error">{error}</span>}
                    </div>
                );

            case "radio":
                return (
                    <div key={filter.id} className="filter-item" style={itemStyle}>
                        {filter.label && <ui.Label>{filter.label}</ui.Label>}
                        <ui.Radio
                            id={filter.id}
                            value={(value as string) || ""}
                            options={filter.options || []}
                            disabled={filter.disabled}
                            className={filter.className}
                            style={filter.style}
                            onChange={(val) => handleFilterChange(filter.id, val)}
                        />
                        {error && <span className="filter-error">{error}</span>}
                    </div>
                );

            default:
                return null;
        }
    };

    const renderLoadingSkeleton = () => {
        const skeletonItems = Array.from({ length: Math.min(columns * 2, 6) }, (_, index) => (
            <div key={`skeleton-${index}`} className="filter-item filter-item--skeleton">
                <div className="skeleton-label"></div>
                <div className="skeleton-input"></div>
            </div>
        ));

        return skeletonItems;
    };

    const layoutClass = `filter-layout--${layout}`;
    const spacingClass = `filter-layout--spacing-${spacing}`;

    const getResponsiveColumns = (originalColumns: number) => {
        let lg, md, sm;

        switch (originalColumns) {
            case 1:
            case 2:
                lg = originalColumns;
                md = originalColumns;
                sm = originalColumns === 2 ? 2 : 1;
                break;
            case 3:
                lg = 3;
                md = 2;
                sm = 2;
                break;
            case 4:
                lg = 3;
                md = 2;
                sm = 2;
                break;
            case 5:
            case 6:
                lg = 4;
                md = 3;
                sm = 2;
                break;
            default:
                lg = Math.min(originalColumns, 4);
                md = Math.min(originalColumns, 3);
                sm = 2;
        }

        return { lg, md, sm };
    };

    const responsiveCols = getResponsiveColumns(columns);

    const gridStyle = layout === "grid" ? {
        "--columns": columns,
        "--columns-lg": responsiveCols.lg,
        "--columns-md": responsiveCols.md,
        "--columns-sm": responsiveCols.sm
    } as React.CSSProperties : {};

    return (
        <div className={`filter-layout ${layoutClass} ${spacingClass} ${className} ${loading ? 'filter-layout--loading' : ''}`} style={gridStyle}>
            {(title || collapsible) && (
                <div className="filter-layout__header">
                    {title && <h3 className="filter-layout__title">{title}</h3>}
                    {collapsible && (
                        <>
                            <ui.Button
                                type="button"
                                variant="secondary"
                                size="small"
                                className="filter-layout__toggle"
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                aria-expanded={!isCollapsed}
                                disabled={loading}
                                rightIcon={
                                    <div className={`toggle-icon ${isCollapsed ? "collapsed" : ""}`}>
                                        <ui.Icons name="chevronDown" strokeWidth={3} />
                                    </div>
                                }
                                iconOnlyOnMobile={true}
                            >
                                <div className="toggle-text">
                                    {isCollapsed ? "Show Filters" : "Hide Filters"}
                                </div>
                            </ui.Button>
                        </>
                    )}
                </div>
            )}

            {(!collapsible || !isCollapsed) && (
                <>
                    <div className="filter-layout__content">
                        {loading ? renderLoadingSkeleton() : filters.map(renderFilterItem)}
                    </div>

                    {showResetButton && (
                        <div className="filter-layout__actions">
                            <ui.Button
                                type="button"
                                variant="outline"
                                size="small"
                                className="filter-button"
                                onClick={handleReset}
                                disabled={loading}
                                leftIcon={<ui.Icons name="refresh" size={16} />}
                            >
                                Reset
                            </ui.Button>
                        </div>
                    )}
                </>
            )}
            {downloadReport && (
                <div className="filter-layout__footer">
                    <ui.Button
                        type="button"
                        variant="primary"
                        size="small"
                        className="filter-button filter-button__download-report"
                        rightIcon={<ui.Icons name="download" />}
                        disabled={loading}
                        onClick={onDownloadReport}
                        iconOnlyOnMobile={true}
                    >
                        Download Report
                    </ui.Button>
                </div>
            )}
        </div>
    );
};

export default FilterLayout;