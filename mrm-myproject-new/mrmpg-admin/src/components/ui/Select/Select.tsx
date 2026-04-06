import React, { useState, useRef, useEffect } from "react";
import "./Select.scss";

interface SelectOption {
    label: string;
    value: string;
    disabled?: boolean;
}

interface SelectProps {
    id: string;
    value: string;
    placeholder?: string;
    options: SelectOption[];
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
    onChange: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    searchable?: boolean;
    variant?: "native" | "custom";
    defaultValue?: string;
}

const Select: React.FC<SelectProps> = ({
    id,
    value,
    placeholder = "Select an option",
    options,
    disabled = false,
    className = "",
    style,
    onChange,
    onFocus,
    onBlur,
    searchable = false,
    variant = "custom",
    defaultValue
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Set default value on mount if provided and value is empty
    useEffect(() => {
        if (defaultValue && !value && options.some(option => option.value === defaultValue)) {
            onChange(defaultValue);
        }
    }, [defaultValue, value, options, onChange]);

    // Filter options based on search term
    const filteredOptions = searchTerm
        ? options.filter(option => 
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : options;

    // Get display text for selected option
    const getDisplayText = () => {
        const selectedOption = options.find(opt => opt.value === value);
        return selectedOption ? selectedOption.label : placeholder;
    };

    // Handle option selection
    const handleOptionSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm("");
        onBlur?.();
    };

    // Handle dropdown toggle
    const handleDropdownToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
                onFocus?.();
            } else {
                onBlur?.();
            }
        }
    };

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm("");
                onBlur?.();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onBlur]);

    // Reset search when dropdown closes
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm("");
        }
    }, [isOpen]);

    // Native variant (original behavior)
    if (variant === "native") {
        return (
            <div className={`select-wrapper select-wrapper--native ${className}`} style={style}>
                <select
                    id={id}
                    value={value}
                    disabled={disabled}
                    className={`select-input ${disabled ? "disabled" : ""}`}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={onFocus}
                    onBlur={onBlur}
                >
                    <option value="">{placeholder}</option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value} disabled={option.disabled}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="select-arrow">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                        <path
                            d="M1 1.5L6 6.5L11 1.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </div>
        );
    }

    // Custom variant (new design)
    return (
        <div 
            ref={dropdownRef}
            className={`select-wrapper select-wrapper--custom ${className} ${disabled ? "disabled" : ""} ${isOpen ? "open" : ""}`} 
            style={style}
        >
            <div 
                id={id}
                className="select-trigger"
                onClick={handleDropdownToggle}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleDropdownToggle();
                    }
                }}
                tabIndex={disabled ? -1 : 0}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <span className={`selected-text ${!value ? "placeholder" : ""}`}>
                    {getDisplayText()}
                </span>
                <span className={`select-arrow ${isOpen ? "open" : ""}`}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </span>
            </div>

            {isOpen && (
                <div className="select-dropdown-content" role="listbox">
                    {searchable && (
                        <div className="search-container">
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search options..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                            />
                        </div>
                    )}

                    <div className="options-container">
                        {/* Empty/placeholder option */}
                        {!value && (
                            <div
                                className="select-option placeholder-option"
                                onClick={() => handleOptionSelect("")}
                                role="option"
                                aria-selected={!value}
                            >
                                {placeholder}
                            </div>
                        )}
                        
                        {filteredOptions.map((option) => (
                            <div
                                key={option.value}
                                className={`select-option ${option.disabled ? "disabled" : ""} ${value === option.value ? "selected" : ""}`}
                                onClick={() => !option.disabled && handleOptionSelect(option.value)}
                                role="option"
                                aria-selected={value === option.value}
                                aria-disabled={option.disabled}
                            >
                                <span className="option-label">{option.label}</span>
                                {value === option.value && (
                                    <span className="check-icon">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </span>
                                )}
                            </div>
                        ))}
                        
                        {filteredOptions.length === 0 && (
                            <div className="no-options">
                                {searchTerm ? "No matching options" : "No options available"}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Select;
