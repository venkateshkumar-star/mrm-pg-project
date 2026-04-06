import React from "react";
import "./Radio.scss";

interface RadioOption {
    label: string;
    value: string;
    disabled?: boolean;
}

interface RadioProps {
    id: string;
    value: string;
    options: RadioOption[];
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
    onChange: (value: string) => void;
}

const Radio: React.FC<RadioProps> = ({
    id,
    value,
    options,
    disabled = false,
    className = "",
    style,
    onChange
}) => {
    return (
        <div className={`radio-wrapper ${className}`} style={style}>
            {options.map((option) => (
                <label key={option.value} className={`radio-label ${disabled || option.disabled ? "disabled" : ""}`}>
                    <input
                        type="radio"
                        name={id}
                        value={option.value}
                        checked={value === option.value}
                        disabled={disabled || option.disabled}
                        className="radio-input"
                        onChange={(e) => onChange(e.target.value)}
                    />
                    <span className="radio-custom"></span>
                    <span className="radio-text">{option.label}</span>
                </label>
            ))}
        </div>
    );
};

export default Radio;
