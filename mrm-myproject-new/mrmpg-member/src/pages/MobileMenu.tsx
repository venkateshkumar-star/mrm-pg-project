import React from "react";
import { NavLink } from "react-router-dom";
import * as Icons from "../../public/Icons";
import { useNavigate } from "react-router-dom";
import { Icon } from "lucide-react";
interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { name: "Overview", path: "/overview", icon: Icons.OverviewIcon },
  { name: "Document", path: "/document", icon: Icons.DocumentIcon },
  { name: "Profile", path: "/profile-details", icon: Icons.ProfileIcon },
  {name:"Payment", path:"/upload-proof", icon: Icons.PayIcon},
  {name:"LeavingRequestStatus" , path:"/leaving-request" , icon:Icons.DocumentIcon},
  {name:"Password Change", path:"/reset-password" ,icon:Icons.PasswordIcon},
  ];
      // <Route path="/upload-proof" element={<Pages.UploadProof />} />
export const MobileMenu: React.FC<MenuProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/login");
  };
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="fixed top-0 right-0 w-64 h-screen bg-white shadow-lg z-50 transform transition-transform">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="font-semibold text-lg">Menu</h2>
          <button onClick={onClose} className="text-xl font-bold">
            ✕
          </button>
        </div>

        <nav className="flex flex-col p-4 gap-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-3 rounded-lg transition
                  ${isActive
                    ? "bg-blue-100 text-red-600 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"}`
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
      </div>
    </>
  );
};
