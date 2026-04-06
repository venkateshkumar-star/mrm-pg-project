import React from "react";
import "./HeaderLayout.scss"
import ui from "@/components/ui";
import type { IconName } from "@/types";
interface HeaderButton {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "small" | "medium" | "large";
    icon?: IconName;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
}

interface HeaderLayoutProps {
    title: string;
    subText?: string;
    pageInfo?: string;
    buttons?: HeaderButton[];
}

const HeaderLayout = ({ title, subText, pageInfo, buttons = [] }: HeaderLayoutProps): React.ReactElement => {
    return (
        <header>
            <div className="header-container">
                <div className="header-content">
                    <div className="header-text">
                        <div className="header-title">
                            <h1>{title}</h1>
                        </div>
                        <div className="header-subtext">
                            {subText && <p>{subText}</p>}
                        </div>
                        {pageInfo && (
                            <div className="header-page-info">
                                <span className="page-info-text">{pageInfo}</span>
                            </div>
                        )}
                    </div>

                    {buttons.length > 0 && (
                        <div className="header-actions">
                            {buttons.map((button, index) => (
                                <ui.Button
                                    key={index}
                                    onClick={button.onClick}
                                    disabled={button.disabled || button.loading}
                                    variant={button.variant || 'primary'}
                                    size={button.size || 'medium'}
                                    className={button.className || ''}
                                    leftIcon={button.icon ? <ui.Icons name={button.icon} /> : undefined}
                                >
                                    {button.loading && <span className="header-btn__loader"></span>}
                                    <span className="header-btn__text">{button.label}</span>
                                </ui.Button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default HeaderLayout;
