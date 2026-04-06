import React, { useState } from "react";
import { Button, RentCard, StatusBadge, TagBadge } from "../components";
import { PaymentStatusPopup } from "../components/PaymentStatusPopup/PaymentStatusPopup";
import { Menu } from "lucide-react";

export const Playground: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar for desktop */}
      <div className={`bg-gray-50 md:block fixed md:relative top-0 right-0 h-full w-64 p-5 transform transition-transform duration-300 ease-in-out z-50
        ${sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}`}>
        <div className="flex justify-between items-center mb-5 md:hidden">
          <span className="font-bold text-lg">Menu</span>
          <button onClick={() => setSidebarOpen(false)}>
            ✕
          </button>
        </div>

        <Button
          title="Pay Now"
          width="w-full"
          height="h-16"
          onPress={() => alert("Clicked")}
        />

        <div className="flex flex-wrap gap-4 justify-center mt-5">
          <StatusBadge title="Pending" />
          <StatusBadge title="Paid" />
          <StatusBadge title="Unknown" />
          <StatusBadge title="Under Review" width="w-32" />
        </div>

     
        <RentCard
          heading="Current Month Rent"
          price="7,500"
          dueDate="10 Sep 2025"
          description="Includes maintenance & parking"
          status="Pending"
          width="w-full mt-5"
        />

        <TagBadge title="Payment" type={true} className="mt-5" />
      </div>

      {/* Mobile toggle button */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-indigo-600 rounded-full text-white shadow-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 p-5 md:ml-64">
        <PaymentStatusPopup
          status="Under Review"
          description={`Once you upload, the status changes to Under Review automatically. 
If rejected, you can upload again. Once approved, re-uploads are disabled.`}
          submittedOn="Dec 02, 2025 – 11:21 AM"
          billingMonth="December 2025"
          popupWidth="w-full md:w-[1000px]"
          popupHeight="h-[80vh]"
          previewHeight="h-[30vh]"
        />
      </div>
    </div>
  );
};
