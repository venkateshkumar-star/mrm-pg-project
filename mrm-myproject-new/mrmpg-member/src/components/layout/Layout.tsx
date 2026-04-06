
import React, { ReactNode } from "react";
import { TopBar } from "../TopBar/TopBar";
import { Sidebar } from "../Sidebar/Sidebar";

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, showSidebar = false }) => {
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <TopBar />

      <div className="flex flex-1">
        {showSidebar && <Sidebar />}

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
