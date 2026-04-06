import React from "react";
import ui from "@/components/ui";
import type { types } from "@/types";
import "./CardLayout.scss";

interface ActionButton {
    label: string;
    icon?: types["IconName"];
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "small" | "medium" | "large";
    onClick: () => void;
    disabled?: boolean;
}

interface CardLayoutProps {
    title: string;
    value: string | number;
    icon: types["IconName"];
    percentage?: number;
    trend?: "up" | "down" | "neutral";
    color?: "primary" | "success" | "warning" | "error" | "info";
    className?: string;
    onClick?: () => void;
    loading?: boolean;
    subtitle?: string;

    actions?: ActionButton[];
    showActions?: "always" | "hover" | "never";
    customContent?: React.ReactNode;
    footer?: React.ReactNode;
    badge?: {
        text: string;
        color?: "primary" | "success" | "warning" | "error" | "info";
    };
    style?: React.CSSProperties;
}

const CardLayout: React.FC<CardLayoutProps> = ({
    title,
    value,
    icon,
    percentage,
    trend,
    color = "primary",
    className = "",
    onClick,
    loading = false,
    subtitle,
    actions = [],
    showActions = "hover",
    customContent,
    footer,
    badge,
    style = {}
}) => {
    const formatPercentage = (percent: number) => {
        const sign = percent > 0 ? "+" : "";
        return `${sign}${percent}%`;
    };

    const getTrendIcon = () => {
        switch (trend) {
            case "up":
                return "trendingUp";
            case "down":
                return "trendingDown";
            default:
                return "minus";
        }
    };

    const getTrendColor = () => {
        switch (trend) {
            case "up":
                return "success";
            case "down":
                return "error";
            default:
                return "neutral";
        }
    };

    if (loading) {
        return (
            <div className={`card-layout card-layout--loading ${className}`}>
                <div className="card-layout__skeleton">
                    <div className="skeleton-header">
                        <div className="skeleton-icon"></div>
                        <div className="skeleton-percentage"></div>
                    </div>
                    <div className="skeleton-content">
                        <div className="skeleton-value"></div>
                        <div className="skeleton-title"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div 
            className={`card-layout card-layout--${color} ${onClick ? 'card-layout--clickable' : ''} ${showActions !== 'never' && actions.length > 0 ? `card-layout--actions-${showActions}` : ''} ${badge ? 'card-layout--has-badge' : ''} ${className}`}
            onClick={onClick}
            style={style}
        >
            <span className="card-layout__border"></span>
            
            {/* New floating badge design */}
            {badge && (
                <div className={`card-layout__badge-container ${percentage !== undefined ? 'card-layout__badge-container--with-trend' : ''}`}>
                    <div className={`card-layout__badge card-layout__badge--${badge.color || color}`}>
                        {badge.text}
                    </div>
                </div>
            )}

            <div className="card-layout__header">
                <div className="card-layout__icon">
                    <ui.Icons name={icon} size={24} />
                </div>
                {percentage !== undefined && (
                    <div className={`card-layout__trend card-layout__trend--${getTrendColor()}`}>
                        <ui.Icons name={getTrendIcon()} size={16} strokeWidth={2} />
                        <span className="trend-text">{formatPercentage(percentage)}</span>
                    </div>
                )}
            </div>

            <div className="card-layout__content">
                <div className="card-layout__value">{value}</div>
                <div className="card-layout__title">{title}</div>
                {subtitle && (
                    <div className="card-layout__subtitle">{subtitle}</div>
                )}
                
                {customContent && (
                    <div className="card-layout__custom">
                        {customContent}
                    </div>
                )}
            </div>

            {actions.length > 0 && (
                <div className="card-layout__actions">
                    {actions.map((action, index) => (
                        <ui.Button
                            key={index}
                            variant={action.variant || "outline"}
                            size={action.size || "small"}
                            onClick={(e) => {
                                e.stopPropagation();
                                action.onClick();
                            }}
                            disabled={action.disabled}
                            className="card-action-btn"
                        >
                            {action.icon && <ui.Icons name={action.icon} size={16} />}
                            {action.label}
                        </ui.Button>
                    ))}
                </div>
            )}

            {footer && (
                <div className="card-layout__footer">
                    {footer}
                </div>
            )}
        </div>
    );
};

export default CardLayout;
