import React, { useState, useEffect } from "react";
import "./NumberInput.scss";

interface NumberInputProps {
    id: string;
    value: number;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
    min?: number;
    max?: number;
    step?: number;
    onChange: (value: number) => void;
}

const NumberInput: React.FC<NumberInputProps> = ({
    id,
    value,
    placeholder,
    disabled = false,
    className = "",
    style,
    min,
    max,
    step = 1,
    onChange
}) => {
    // Use internal string state to allow empty input
    const [inputValue, setInputValue] = useState<string>(value === 0 ? '' : value.toString());

    // Sync with external value changes
    useEffect(() => {
        // Only update if the external value is different from what we have
        const currentNumValue = inputValue === '' ? 0 : Number(inputValue);
        if (value !== currentNumValue) {
            setInputValue(value === 0 ? '' : value.toString());
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        
        // Convert to number and call onChange
        const numValue = newValue === '' ? 0 : Number(newValue);
        onChange(numValue);
    };

    return (
        <div className={`number-input-wrapper ${className}`} style={style}>
            <input
                id={id}
                type="number"
                value={inputValue}
                placeholder={placeholder}
                disabled={disabled}
                className={`number-input ${disabled ? "disabled" : ""}`}
                min={min}
                max={max}
                step={step}
                onChange={handleChange}
            />
        </div>
    );
};

export default NumberInput;
