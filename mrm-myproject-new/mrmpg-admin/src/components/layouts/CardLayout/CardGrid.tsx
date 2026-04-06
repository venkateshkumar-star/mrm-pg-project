import React from "react";
import CardLayout from "./CardLayout";
import type {  types } from "@/types";
import ui from "@/components/ui";
import "./CardGrid.scss";

interface ActionButton {
    label: string;
    icon?: types["IconName"];
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "small" | "medium" | "large";
    onClick: () => void;
    disabled?: boolean;
}

interface CardData {
    title?: string;
    value?: string | number;
    icon: types["IconName"];
    percentage?: number;
    trend?: "up" | "down" | "neutral";
    color?: "primary" | "success" | "warning" | "error" | "info";
    subtitle?: string;
    onClick?: () => void;
    loading?: boolean;
    className?: string;
    style?: React.CSSProperties;
    actions?: ActionButton[];
    showActions?: "always" | "hover" | "never";
    customContent?: React.ReactNode;
    footer?: React.ReactNode;
    badge?: {
        text: string;
        color?: "primary" | "success" | "warning" | "error" | "info";
    };
}

interface CardGridProps {
    cards: CardData[];
    loading?: boolean;
    columns?: 1 | 2 | 3 | 4 | 5 | 6;
    gap?: "sm" | "md" | "lg";
    className?: string;
    showRefresh?: boolean;
    lastUpdated?: Date | string;
    onRefresh?: () => void;
    refreshLoading?: boolean;
}

const CardGrid: React.FC<CardGridProps> = ({
    cards,
    loading = false,
    columns = 4,
    gap = "md",
    className = "",
    showRefresh = false,
    lastUpdated,
    onRefresh,
    refreshLoading = false
}) => {
    // Format last updated timestamp
    const formatLastUpdated = (timestamp: Date | string) => {
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) {
            return "Just now";
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
        } else if (diffInMinutes < 1440) {
            const hours = Math.floor(diffInMinutes / 60);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    };

    return (
        <div className={`card-grid-container ${className}`}>
            {showRefresh && (
                <div className="card-grid-header">
                    <div className="last-updated">
                        <ui.Icons name="clock" size={16} />
                        <span className="timestamp">
                            {lastUpdated ? `Last updated: ${formatLastUpdated(lastUpdated)}` : 'Never updated'}
                        </span>
                    </div>
                    <div className="refresh-section">
                        <ui.Button
                            variant="outline"
                            size="small"
                            onClick={onRefresh}
                            disabled={refreshLoading || loading}
                            leftIcon={<ui.Icons name={refreshLoading ? "loader" : "refresh"} size={16} className={refreshLoading ? "animate-spin" : ""} />}
                            iconOnlyOnMobile={true}
                        >
                            {refreshLoading ? "Refreshing..." : "Refresh"}
                        </ui.Button>
                    </div>
                </div>
            )}
            
            <div className={`card-grid card-grid--${gap} card-grid--cols-${columns}`}>
                {cards.map((card, index) => (
                    <CardLayout
                        key={index}
                        title={card.title || ""}
                        value={card.value || ""}
                        icon={card.icon}
                        percentage={card.percentage}
                        trend={card.trend}
                        color={card.color || "primary"}
                        subtitle={card.subtitle || ""}
                        onClick={card.onClick}
                        loading={card.loading || loading}
                        className={card.className}
                        style={card.style}
                        actions={card.actions}
                        showActions={card.showActions}
                        customContent={card.customContent}
                        footer={card.footer}
                        badge={card.badge}
                    />
                ))}
            </div>
        </div>
    );
};

export default CardGrid;
