import React, { useState, useRef, useEffect, useCallback } from 'react';
import ui from '@/components/ui';
import { ApiClient } from '@/utils';
import type { MonthOptionsResponse } from '@/types/apiResponseTypes';
import './MonthPicker.scss';
import { useNotification } from '../Notification';

export interface MonthRange {
  month: number; // 0-11 (January is 0)
  year: number;
  startDate: Date;
  endDate: Date;
  displayName: string;
}

export interface MonthPickerProps {
  id?: string;
  value?: MonthRange | null;
  onChange: (monthRange: MonthRange | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  error?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  showQuickSelect?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'outline' | 'filled';
  clearable?: boolean;
  yearRange?: { start: number; end: number };
  onOpen?: () => void;
  onClose?: () => void;
}

const MonthPicker: React.FC<MonthPickerProps> = ({
  id,
  value,
  onChange,
  placeholder = "Select a month",
  disabled = false,
  className = "",
  style,
  label,
  error,
  required = false,
  minDate,
  maxDate,
  showQuickSelect = true,
  size = 'medium',
  variant = 'outline',
  clearable = true,
  yearRange,
  onOpen,
  onClose
}) => {
  const currentDate = new Date();
  const [isOpen, setIsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(value?.year || currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<MonthRange | null>(value || null);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]); // Start empty, will be populated by API
  const [isLoadingMonths, setIsLoadingMonths] = useState(true); // Start with loading true
  const [hasApiData, setHasApiData] = useState(false); // Track if we have received API data
  
  const containerRef = useRef<HTMLDivElement>(null);

  const notification = useNotification();

  // Fetch available months from API for a specific year
  const fetchAvailableMonths = useCallback(async (year: number) => {
    setIsLoadingMonths(true);
    setHasApiData(false);
    try {
      const apiResponse = await ApiClient.get(`/filters/reports/months?year=${year}`) as MonthOptionsResponse;
      if (apiResponse.success && apiResponse.data) {
        // Handle the actual API response structure where months have 'value' and 'label'
        const monthNumbers = apiResponse.data.months.map(monthOption => parseInt(monthOption.value));
        setAvailableMonths(monthNumbers);
        setHasApiData(true);
      }
      else {
        // If API fails, disable all months (empty array)
        setAvailableMonths([]);
        setHasApiData(true);
        notification.showError(apiResponse.error || "Failed to fetch available months", apiResponse.message, 5000);
      }
    } catch (error) {
      // If API fails, disable all months (empty array)
      setAvailableMonths([]);
      setHasApiData(true);
      notification.showError("Failed to fetch available months", error instanceof Error ? error.message : String(error), 5000);
    } finally {
      setIsLoadingMonths(false);
    }
  }, [notification]);

  // Update selected month when value prop changes
  useEffect(() => {
    setSelectedMonth(value || null);
    if (value) {
      setCurrentYear(value.year);
    }
  }, [value]);

  // Fetch available months when currentYear changes
  useEffect(() => {
    fetchAvailableMonths(currentYear);
  }, [currentYear, fetchAvailableMonths]);

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const shortMonthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Create month range object
  const createMonthRange = useCallback((month: number, year: number): MonthRange => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    
    return {
      month,
      year,
      startDate,
      endDate,
      displayName: `${monthNames[month]} ${year}`
    };
  }, [monthNames]);

  // Check if date is within allowed range
  const isMonthAllowed = useCallback((month: number, year: number): boolean => {
    // Check basic date constraints first
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    if (minDate && endDate < minDate) return false;
    if (maxDate && startDate > maxDate) return false;
    
    // Apply API restrictions for the current year
    if (year === currentYear) {
      // If we're still loading or haven't received API data, disable all months
      if (isLoadingMonths || !hasApiData) {
        return false;
      }
      // API returns months 1-12, JavaScript months are 0-11, so we need month + 1
      return availableMonths.includes(month + 1);
    }
    
    // For other years, allow all months (we'll fetch data when year changes)
    return true;
  }, [minDate, maxDate, currentYear, availableMonths, isLoadingMonths, hasApiData]);

  // Format month range for display
  const formatMonthRange = useCallback((monthRange: MonthRange): string => {
    return monthRange.displayName;
  }, []);

  // Handle month selection
  const handleMonthSelect = useCallback((month: number, year: number) => {
    if (!isMonthAllowed(month, year)) return;
    
    const monthRange = createMonthRange(month, year);
    setSelectedMonth(monthRange);
    onChange(monthRange);
    setIsOpen(false);
    onClose?.();
  }, [isMonthAllowed, createMonthRange, onChange, onClose]);

  // Handle clear selection
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMonth(null);
    onChange(null);
  }, [onChange]);

  // Handle input click
  const handleInputClick = useCallback(() => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      onOpen?.();
    } else {
      onClose?.();
    }
  }, [disabled, isOpen, onOpen, onClose]);

  // Handle year navigation
  const navigateYear = useCallback((direction: 'prev' | 'next') => {
    setCurrentYear(prev => {
      const newYear = direction === 'prev' ? prev - 1 : prev + 1;
      const range = yearRange || { start: 1900, end: 2100 };
      const clampedYear = Math.max(range.start, Math.min(range.end, newYear));
      
      // Reset API data flags when year changes
      setHasApiData(false);
      setIsLoadingMonths(true);
      
      // Note: fetchAvailableMonths will be called by the useEffect when currentYear changes
      return clampedYear;
    });
  }, [yearRange]);

  // Quick select options
  const getQuickSelectOptions = useCallback(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    return [
      {
        label: 'This Month',
        action: () => handleMonthSelect(currentMonth, currentYear),
        icon: 'target' as const
      },
      {
        label: 'Last Month',
        action: () => {
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          handleMonthSelect(lastMonth, lastMonthYear);
        },
        icon: 'arrowLeft' as const
      },
      {
        label: 'Next Month',
        action: () => {
          const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
          const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
          handleMonthSelect(nextMonth, nextMonthYear);
        },
        icon: 'arrowRight' as const
      }
    ];
  }, [handleMonthSelect]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Generate months grid
  const currentMonthDate = new Date();
  const isCurrentMonth = (month: number, year: number) => 
    month === currentMonthDate.getMonth() && year === currentMonthDate.getFullYear();

  const containerClasses = [
    'month-picker',
    `month-picker--${size}`,
    `month-picker--${variant}`,
    disabled && 'month-picker--disabled',
    error && 'month-picker--error',
    isOpen && 'month-picker--open',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} style={style} ref={containerRef}>
      {label && (
        <label htmlFor={id} className="month-picker__label">
          {label}
          {required && <span className="month-picker__required">*</span>}
        </label>
      )}
      
      <div className="month-picker__input-wrapper">
        <div className="month-picker__input-container" onClick={handleInputClick}>
          <div className="month-picker__input-content">
            <ui.Icons name="calendar" className="month-picker__input-icon" />
            <span className={`month-picker__input-text ${!selectedMonth ? 'month-picker__placeholder' : ''}`}>
              {selectedMonth ? formatMonthRange(selectedMonth) : placeholder}
            </span>
          </div>
          
          <div className="month-picker__actions">
            {clearable && selectedMonth && !disabled && (
              <button
                type="button"
                className="month-picker__clear-btn"
                onClick={handleClear}
                aria-label="Clear selection"
              >
                <ui.Icons name="x" size={14} />
              </button>
            )}
            <ui.Icons 
              name={isOpen ? "chevronUp" : "chevronDown"} 
              className="month-picker__chevron" 
              size={16}
            />
          </div>
        </div>

        {isOpen && (
          <div className="month-picker__dropdown">
            <div className="month-picker__dropdown-header">
              <div className="month-picker__year-navigation">
                <button
                  type="button"
                  className="month-picker__nav-btn"
                  onClick={() => navigateYear('prev')}
                  aria-label="Previous year"
                >
                  <ui.Icons name="chevronLeft" size={18} />
                </button>
                
                <h3 className="month-picker__year-title">{currentYear}</h3>
                
                <button
                  type="button"
                  className="month-picker__nav-btn"
                  onClick={() => navigateYear('next')}
                  aria-label="Next year"
                >
                  <ui.Icons name="chevronRight" size={18} />
                </button>
              </div>

              {showQuickSelect && (
                <div className="month-picker__quick-select">
                  {getQuickSelectOptions().map((option, index) => (
                    <button
                      key={index}
                      type="button"
                      className="month-picker__quick-btn"
                      onClick={option.action}
                    >
                      <ui.Icons name={option.icon} size={14} />
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="month-picker__months-container">
              <div className={`month-picker__months-grid ${isLoadingMonths ? 'month-picker__months-grid--loading' : ''}`}>
                {isLoadingMonths ? (
                  // Show skeleton loading state for each month
                  Array.from({ length: 12 }, (_, monthIndex) => (
                    <div
                      key={`loading-${monthIndex}`}
                      className="month-picker__month-btn month-picker__month-btn--loading"
                    >
                      <span className="month-picker__month-name">{shortMonthNames[monthIndex]}</span>
                      <span className="month-picker__month-full">{monthNames[monthIndex]}</span>
                    </div>
                  ))
                ) : (
                  monthNames.map((monthName, monthIndex) => {
                    const isSelected = selectedMonth && 
                      selectedMonth.month === monthIndex && 
                      selectedMonth.year === currentYear;
                    const isCurrent = isCurrentMonth(monthIndex, currentYear);
                    const isDisabled = !isMonthAllowed(monthIndex, currentYear);

                    return (
                      <button
                        key={monthIndex}
                        type="button"
                        className={[
                          'month-picker__month-btn',
                          isSelected && 'month-picker__month-btn--selected',
                          isCurrent && 'month-picker__month-btn--current',
                          isDisabled && 'month-picker__month-btn--disabled'
                        ].filter(Boolean).join(' ')}
                        onClick={() => handleMonthSelect(monthIndex, currentYear)}
                        disabled={isDisabled}
                      >
                        <span className="month-picker__month-name">{shortMonthNames[monthIndex]}</span>
                        <span className="month-picker__month-full">{monthName}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="month-picker__footer">
              <span className="month-picker__footer-text">
                {selectedMonth 
                  ? `Selected: ${selectedMonth.displayName}` 
                  : 'No month selected'}
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="month-picker__error-message">
          <ui.Icons name="alertTriangle" size={14} />
          {error}
        </div>
      )}
    </div>
  );
};

export default MonthPicker;
