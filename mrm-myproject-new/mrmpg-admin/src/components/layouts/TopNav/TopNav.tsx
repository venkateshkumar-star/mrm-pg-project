import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import type { types } from "@/types";
import type { AdminResponse } from "@/types/apiResponseTypes";
import "./TopNav.scss"
import PG_LOGO from "@images/MRM_PG.png";
import tempProfile from "@images/profile-temp.jpg";
import ui from "@/components/ui";
import { AuthManager } from "@/utils/index";

interface TopNavProps {
    selectedTab?: string | null;
}

const TopNav = ({ selectedTab }: TopNavProps): React.ReactElement => {

    const navigate = useNavigate();
    const location = useLocation();
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [staffData, setStaffData] = useState<AdminResponse | null>(null);

    // Get staff data on component mount
    useEffect(() => {
        const staff = AuthManager.getStaffData() as AdminResponse;
        setStaffData(staff);
    }, []);

    const handleLogout = () => {
        AuthManager.clearAuthData();
        navigate('/login');
        setActiveDropdown(null);
    };

    const menus: types["Menu"][] = [
        {
            id: "dashboard",
            layout: "entity",
            label: "Dashboard",
            path: "/",
            class: "dashboard-nav"
        },
        {
            id: "members",
            layout: "root",
            label: "Members",
            path: "/members?enrollment=long-term",
            class: "members-tab",
            tabs: [
                {
                    id: "long_term",
                    layout: "entity",
                    label: "Long Term",
                    path: "/members?enrollment=long-term",
                    selected: true,
                    class: "long-term-nav"
                },
                {
                    id: "short_term",
                    layout: "entity",
                    label: "Short Term",
                    path: "/members?enrollment=short-term",
                    selected: false,
                    class: "short-term-nav"
                },
            ]
        },
        {
            id: "approvals",
            layout: "entity",
            label: "Approvals",
            path: "/approvals",
            selected: false,
            class: "approvals-nav"
        },
        {
            id: "rooms",
            layout: "entity",
            label: "Rooms",
            path: "/rooms",
            class: "rooms-nav"

        },
        {
            id: "expenses",
            layout: "entity",
            label: "Expenses",
            path: "/expenses",
            class: "expenses-nav"
        },
        {
            id: "report",
            layout: "root",
            label: "Report",
            path: "/reports?type=weekly",
            class: "report-nav",
            tabs: [
                {
                    id: "weekly",
                    layout: "entity",
                    label: "Weekly Report",
                    path: "/reports?type=weekly",
                    class: "weekly-report-nav"
                },
                {
                    id: "monthly",
                    layout: "entity",
                    label: "Monthly Report",
                    path: "/reports?type=monthly",
                    class: "monthly-report-nav"
                }
            ]
        },
        {
            id: "enquiry",
            layout: "entity",
            label: "Enquiry",
            path: "/enquiry",
            class: "enquiry-nav"

        },
        {
            id: "profile",
            layout: "image",
            label: "",
            image: tempProfile,
            path: "#",
            class: "profile-nav"
        }
    ]

    const handleDropdownClick = (path: string) => {
        navigate(path);
        setActiveDropdown(null);
        setIsMobileMenuOpen(false);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
        setActiveDropdown(null);
    };

    const handleMobileDropdownClick = (menuId: string) => {
        if (activeDropdown === menuId) {
            setActiveDropdown(null);
        } else {
            setActiveDropdown(menuId);
        }
    };

    const isActiveMenu = (menu: types["Menu"]) => {
        const { pathname } = location;

        if (menu.id === "dashboard" && (pathname === "/" || pathname === "/dashboard")) {
            return true;
        }
        if (menu.id === "members" && pathname === "/members") {
            return true;
        }
        if (menu.id === "report" && pathname === "/reports") {
            return true;
        }
        if (menu.id === "review" && pathname === "/review") {
            return true;
        }

        return false;
    };

    const getActiveTabForMenu = (menu: types["Menu"]) => {
        const params = new URLSearchParams(location.search);

        if (menu.id === "students") {
            return selectedTab || params.get('enrollment') || "long_term";
        }
        if (menu.id === "report") {
            return selectedTab || params.get('type') || "weekly";
        }
        if (menu.id === "dashboard") {
            return selectedTab || params.get('view') || "overview";
        }
        return selectedTab;
    };

    const getInitials = (name?: string) => {
        if (!name) return 'US';
        const parts = name.trim().split(/\s+/);
        const initials = parts.map(p => p[0] || '').join('').slice(0, 2).toUpperCase();
        return initials || 'US';
    };

    return (
        <nav>
            <div className="top-nav">
                <div className="top-nav__container">
                    <div className="left-content">
                        <div className="left-logo">
                            <img src={PG_LOGO} alt="Logo" />
                        </div>
                        <div className="logo-text">MRM PG</div>
                    </div>

                    {/* Mobile hamburger button */}
                    <button
                        className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
                        onClick={toggleMobileMenu}
                        aria-label="Toggle mobile menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>

                    {/* Desktop menu */}
                    <div className="right-menus desktop-menu">
                        <ul>
                            {menus.map(menu => (
                                <li
                                    key={menu.id}
                                    className={`nav-item ${menu.layout === "root" ? "has-dropdown" : ""} ${menu.layout === "image" ? "has-dropdown" : ""} ${menu.class}`}
                                    onMouseEnter={() => {
                                        if (menu.layout === "root") {
                                            setActiveDropdown(menu.id);
                                        } else if (menu.layout === "image") {
                                            setActiveDropdown("profile");
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        if (menu.layout === "root" || menu.layout === "image") {
                                            setActiveDropdown(null);
                                        }
                                    }}
                                >
                                    {menu.layout === "root" ? (
                                        <div className="dropdown-wrapper">
                                            <Link
                                                to={menu.path}
                                                className={`nav-link ${activeDropdown === menu.id ? "active" : ""} ${isActiveMenu(menu) ? "current-page" : ""}`}
                                            >
                                                {menu.label}
                                                <div className="dropdown-arrow">
                                                    <ui.Icons name="chevronDown" strokeWidth={3} />
                                                </div>
                                            </Link>
                                            <div className={`dropdown-menu ${activeDropdown === menu.id ? "show" : ""}`}>
                                                {menu.tabs?.map(tab => (
                                                    <Link
                                                        key={tab.id}
                                                        to={tab.path}
                                                        className={`dropdown-item ${getActiveTabForMenu(menu) === tab.id ? "active" : ""} ${tab.class}`}
                                                        onClick={() => handleDropdownClick(tab.path)}
                                                    >
                                                        {tab.label}
                                                    </Link> 
                                                ))}
                                            </div>
                                        </div>
                                    ) : menu.layout === "image" ? (
                                        <div className="dropdown-wrapper">
                                            <div className=" profile-image-container  profile-initials">
                                                {/* <img src={String(menu.image) || ""} alt={menu.label || "Profile"} /> */}
                                                {getInitials(staffData?.name || undefined)}
                                            </div>
                                            <div className={`dropdown-menu profile-dropdown ${activeDropdown === "profile" ? "show" : ""}`}>
                                                <div className="profile-card-header">
                                                    <div className="profile-avatar">
                                                        <div className="profile-initials" aria-hidden="true">{getInitials(staffData?.name || undefined)}</div>
                                                    </div>
                                                    <div className="profile-greeting">
                                                        <h4>Welcome {staffData?.name || 'User'}</h4>
                                                    </div>
                                                </div>

                                                <div className="profile-card-info">
                                                    <div className="pg-type-badge">
                                                        <span className={`pg-type-label pg-type-label--${staffData?.pgType?.toLowerCase() || 'default'}`}>
                                                            {staffData?.pgType === 'MENS' ? 'Men\'s PG' : staffData?.pgType === 'WOMENS' ? 'Women\'s PG' : 'PG Admin'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="profile-card-actions">
                                                    <ui.Button
                                                        variant="outline"
                                                        size="small"
                                                        fullWidth
                                                        onClick={handleLogout}
                                                    >
                                                        Logout
                                                    </ui.Button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <Link to={menu.path} className={`nav-link ${isActiveMenu(menu) ? "current-page" : ""}`}>
                                            {menu.label}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Mobile menu */}
                    <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
                        <ul>
                            {menus.map(menu => (
                                <li
                                    key={menu.id}
                                    className={`nav-item ${menu.layout === "root" ? "has-dropdown" : ""} ${menu.class}`}
                                >
                                    {menu.layout === "root" ? (
                                        <div className="dropdown-wrapper">
                                            <div
                                                className="nav-link mobile-dropdown-trigger"
                                                onClick={() => handleMobileDropdownClick(menu.id)}
                                            >
                                                {menu.label}
                                                <div className={`dropdown-arrow ${activeDropdown === menu.id ? "active" : ""}`}>
                                                    <ui.Icons name="chevronDown" strokeWidth={3} />
                                                </div>
                                            </div>
                                            <div className={`dropdown-menu ${activeDropdown === menu.id ? "show" : ""}`}>
                                                {menu.tabs?.map(tab => (
                                                    <Link
                                                        key={tab.id}
                                                        to={tab.path}
                                                        className={`dropdown-item ${getActiveTabForMenu(menu) === tab.id ? "active" : ""} ${tab.class}`}
                                                        onClick={() => handleDropdownClick(tab.path)}
                                                    >
                                                        {tab.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    ) : menu.layout === "image" ? (
                                        <div className="profile-item mobile-profile">
                                            {/* <img src={String(menu.image) || ""} alt={menu.label || "Profile"} /> */}
                                                <p style={{backgroundColor:"white", margin:"auto", borderRadius:"50%", width:"45px", height:"45px", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--primary-color)", fontWeight:"600", fontSize:"18px", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"}} className="profile-initials" aria-hidden="true">
                                                    {/* <img src={String(menu.image) || ""} alt={menu.label || "Profile"} /> */}
                                                    {getInitials(staffData?.name || undefined)}
                                                </p>
                                            <div className="profile-details">
                                                <div className="profile-name">{staffData?.name || 'User'}</div>
                                                <div className="mobile-pg-type">
                                                    <span className={`pg-type-label pg-type-label--${staffData?.pgType?.toLowerCase() || 'default'}`}>
                                                        {staffData?.pgType === 'MENS' ? 'Men\'s PG' : staffData?.pgType === 'WOMENS' ? 'Women\'s PG' : 'PG Admin'}
                                                    </span>
                                                </div>
                                                <ui.Button
                                                    variant="outline"
                                                    size="small"
                                                    onClick={handleLogout}
                                                    className="mobile-logout-btn"
                                                >
                                                    Logout
                                                </ui.Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Link
                                            to={menu.path}
                                            className={`nav-link ${isActiveMenu(menu) ? "current-page" : ""}`}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            {menu.label}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Mobile overlay */}
                    {isMobileMenuOpen && (
                        <div
                            className="mobile-overlay"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                    )}
                </div>
            </div>
        </nav>
    );
}

export default TopNav;