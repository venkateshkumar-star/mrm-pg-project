import React from "react";
import "./Checkbox.scss";

interface CheckboxProps {
    id: string;
    checked: boolean;
    label?: string;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
    onChange: (checked: boolean) => void;
}

const Checkbox: React.FC<CheckboxProps> = ({
    id,
    checked,
    label,
    disabled = false,
    className = "",
    style,
    onChange
}) => {
    return (
        <div className={`checkbox-wrapper ${className}`} style={style}>
            <label htmlFor={id} className={`checkbox-label ${disabled ? "disabled" : ""}`}>
                <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    className="checkbox-input"
                    onChange={(e) => onChange(e.target.checked)}
                />
                <span className="checkbox-custom"></span>
                {label && <span className="checkbox-text">{label}</span>}
            </label>
        </div>
    );
};

export default Checkbox;
