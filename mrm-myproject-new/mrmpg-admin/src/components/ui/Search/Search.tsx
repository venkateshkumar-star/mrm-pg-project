import React from "react";
import "./Search.scss";
import ui from "@/components/ui";

interface SearchProps {
    id: string;
    value: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
    onChange: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
}

const Search: React.FC<SearchProps> = ({
    id,
    value,
    placeholder = "Search...",
    disabled = false,
    className = "",
    style,
    onChange,
    onFocus,
    onBlur
}) => {
    return (
        <div className={`search-wrapper ${className}`} style={style}>
            <div className="search-icon">
                <ui.Icons name="search" />
            </div>
            <input
                id={id}
                type="text"
                value={value}
                placeholder={placeholder}
                disabled={disabled}
                className={`search-input ${disabled ? "disabled" : ""}`}
                onChange={(e) => onChange(e.target.value)}
                onFocus={onFocus}
                onBlur={onBlur}
            />
        </div>
    );
};

export default Search;
