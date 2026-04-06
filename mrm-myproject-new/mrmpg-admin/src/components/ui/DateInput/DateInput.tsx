import React from "react";
import "./DateInput.scss";

interface DateInputProps {
    id: string;
    value: string;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
    min?: string;
    max?: string;
    onChange: (value: string) => void;
}

const DateInput: React.FC<DateInputProps> = ({
    id,
    value,
    disabled = false,
    className = "",
    style,
    min,
    max,
    onChange
}) => {
    return (
        <div className={`date-input-wrapper ${className}`} style={style}>
            <input
                id={id}
                type="date"
                value={value}
                disabled={disabled}
                className={`date-input ${disabled ? "disabled" : ""}`}
                min={min}
                max={max}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
};

export default DateInput;
