import React, { useState, useEffect, Profiler } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import * as Icons from "../../../public/Icons";


interface SidebarProps {
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

const menuItems = [
  { name: "Overview", path: "/overview", icon: Icons.OverviewIcon },
  { name: "Document", path: "/document", icon: Icons.DocumentIcon },
  { name: "Profile", path: "/profile-details", icon: Icons.ProfileIcon },
  {name:"Payment", path:"/upload-proof", icon: Icons.PayIcon},
  {name:"LeavingRequestStatus" , path:"/leaving-request" , icon:Icons.DocumentIcon},
  {name:"Password Change", path:"/reset-password" ,icon:Icons.PasswordIcon},
  
];

export const Sidebar: React.FC<SidebarProps> = ({ open = false, setOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = useState(open);

  // Sync internal state with prop
  useEffect(() => {
    setInternalOpen(open);
  }, [open]);

  // Close sidebar on route change
  useEffect(() => {
    if (setOpen) setOpen(false);
    else setInternalOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/login");
  };

  return (
    <>
      {/* Mobile hamburger button */}
  

      {/* Overlay for mobile */}
      {(internalOpen || open) && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => (setOpen ? setOpen(false) : setInternalOpen(false))}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 w-64 h-screen bg-white border-r border-gray-200 z-50
          transform transition-transform duration-300 ease-in-out
          md:translate-x-0 md:sticky md:top-0
          flex flex-col
          ${internalOpen || open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <nav className="flex-1 overflow-y-auto p-4 mt-14">
          <div className="flex flex-col gap-8">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() =>
                    setOpen ? setOpen(false) : setInternalOpen(false)
                  }
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition
                      ${
                        isActive
                          ? "bg-blue-100 text-red-600 font-semibold border-r-4 border-red-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="text-xl">
                        <Icon fill={isActive ? "#dc2626" : "#6b7280"} />
                      </span>
                      <span className="text-base font-medium">{item.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-gray-300" />

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg 
              text-red-600 font-medium hover:bg-red-100 transition"
          >
            <span className="text-xl">
              <Icons.LogoutIcon />
            </span>
            Logout
          </button>
        </nav>
      </aside>
    </>
  );
};
