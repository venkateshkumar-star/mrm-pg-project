import React, { useState, useRef, useEffect } from "react";
import "./MultiSelect.scss";
import ui from "@/components/ui";

interface MultiSelectOption {
    label: string;
    value: string;
    disabled?: boolean;
}

interface MultiSelectProps {
    id: string;
    value: string[];
    options: MultiSelectOption[];
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
    onChange: (value: string[]) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    variant?: "list" | "dropdown";
    placeholder?: string;
    searchable?: boolean;
    maxDisplayItems?: number;
    showSelectAll?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
    id,
    value = [],
    options,
    disabled = false,
    className = "",
    style,
    onChange,
    onFocus,
    onBlur,
    variant = "list",
    placeholder = "Select options...",
    searchable = false,
    maxDisplayItems = 3,
    showSelectAll = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter options based on search term
    const filteredOptions = searchTerm
        ? options.filter(option =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : options;

    // Get display text for dropdown
    const getDisplayText = () => {
        if (value.length === 0) return placeholder;
        if (value.length <= maxDisplayItems) {
            return value
                .map(val => options.find(opt => opt.value === val)?.label)
                .filter(Boolean)
                .join(", ");
        }
        return `${value.length} items selected`;
    };

    // Handle checkbox change
    const handleCheckboxChange = (optionValue: string, checked: boolean) => {
        const newValue = checked
            ? [...value, optionValue]
            : value.filter(v => v !== optionValue);
        onChange(newValue);
    };

    // Handle select all
    const handleSelectAll = (checked: boolean) => {
        const newValue = checked
            ? filteredOptions.filter(opt => !opt.disabled).map(opt => opt.value)
            : [];
        onChange(newValue);
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

    // List variant (original behavior)
    if (variant === "list") {
        return (
            <div className={`multi-select-wrapper ${className} ${disabled ? "disabled" : ""}`} style={style}>
                <div
                    id={id}
                    className="multi-select-container"
                    onFocus={onFocus}
                    onBlur={onBlur}
                    tabIndex={disabled ? -1 : 0}
                >
                    {options.map((option) => (
                        <div key={option.value} className="multi-select-option">
                            <ui.Checkbox
                                id={`${id}-${option.value}`}
                                checked={value.includes(option.value)}
                                disabled={option.disabled || disabled}
                                onChange={(checked) => handleCheckboxChange(option.value, checked)}
                                label={option.label}
                            />
                        </div>
                    ))}
                    {options.length === 0 && (
                        <div className="no-options">No options available</div>
                    )}
                </div>
            </div>
        );
    }

    // Dropdown variant
    return (
        <div
            ref={dropdownRef}
            className={`multi-select-wrapper multi-select-dropdown ${className} ${disabled ? "disabled" : ""} ${isOpen ? "open" : ""}`}
            style={style}
        >
            <div
                id={id}
                className="multi-select-trigger"
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
                <span className="selected-text">{getDisplayText()}</span>
                <span className={`dropdown-arrow ${isOpen ? "open" : ""}`}>
                    <ui.Icons name="chevronDown" strokeWidth={3} />
                </span>
            </div>

            {isOpen && (
                <div className="multi-select-dropdown-content" role="listbox">
                    {searchable && (
                        <div className="search-container">
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search options..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    )}

                    {showSelectAll && filteredOptions.length > 0 && (
                        <div className="multi-select-option select-all-option">
                            <ui.Checkbox
                                id={`${id}-select-all`}
                                checked={filteredOptions.filter(opt => !opt.disabled).every(opt => value.includes(opt.value))}
                                onChange={(checked) => handleSelectAll(checked)}
                                label="Select All"
                            />
                        </div>
                    )}

                    <div className="options-container">
                        {filteredOptions.map((option) => (
                            <div key={option.value} className="multi-select-option" role="option">
                                <ui.Checkbox
                                    id={`${id}-dropdown-${option.value}`}
                                    checked={value.includes(option.value)}
                                    disabled={option.disabled || disabled}
                                    onChange={(checked) => handleCheckboxChange(option.value, checked)}
                                    label={option.label}
                                />
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

export default MultiSelect;
