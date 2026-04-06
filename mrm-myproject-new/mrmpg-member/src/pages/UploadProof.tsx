

import React, { useEffect, useRef, useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarIcon, Menu, CloudUpload, X, CheckCircle2 } from "lucide-react";
import axios from "axios";
import { BASE_URL } from "../navigation/Navigation";

/* ===================== TYPES ===================== */
type PaymentStatus = "Approved" | "Rejected" | "Pending" | "No Payment" | "Under Review";
type PaymentMethodType = "ONLINE" | "CASH";

interface MonthData {
  month: string;
  status: PaymentStatus;
  monthNumber: number;
  amount?: number;
}

interface PaymentDetails {
  amount: number;
  paymentMethod: PaymentMethodType;
  rentBillScreenshot?: string | null;
  createdAt?: string;
}

/* ===================== SMALL UI COMPONENTS ===================== */
const StatusBadge = ({ title }: { title: string }) => {
  const colorMap: Record<string, string> = {
    approved: "bg-green-500",
    pending: "bg-orange-400",
    "no payment": "bg-gray-400",
    rejected: "bg-red-500",
    "under review": "bg-blue-500",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-white text-[10px] uppercase tracking-wider font-bold ${colorMap[title.toLowerCase()] || "bg-gray-400"}`}>
      {title}
    </span>
  );
};

const FileUpload = ({ label, disabled, onSelect }: { label: string; disabled?: boolean; onSelect: (file: File | null) => void; }) => {
  const ref = useRef<HTMLInputElement | null>(null);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Only screenshot images (PNG/JPG) are allowed");
      return;
    }
    onSelect(file);
    e.target.value = "";
  };

  return (
    <div>
      <p className="font-medium mb-2 text-sm text-gray-700">{label}</p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => ref.current?.click()}
        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 transition-colors shadow-sm"
      >
        <CloudUpload size={18} />
        <span className="text-sm font-medium">Choose Screenshot</span>
      </button>
      <input ref={ref} type="file" accept="image/*" onChange={handleChange} className="hidden" />
    </div>
  );
};

//Payment Method Dropdown
const PaymentMethodDropdown = ({
  value,
  onChange,
  disabled,
}: {
  value: PaymentMethodType;
  onChange: (v: PaymentMethodType) => void;
  disabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        className="w-full bg-white border-2 border-gray-100 p-4 rounded-xl
                   focus:border-red-500 focus:ring-4 focus:ring-red-50
                   outline-none transition-all font-bold flex items-center
                   justify-between cursor-pointer disabled:opacity-60"
      >
        {value === "ONLINE" ? "Online Transfer / UPI" : "Cash Payment"}
        <span
          className={`text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-2 w-full bg-white border-2 border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <button
            type="button"
            onClick={() => {
              onChange("ONLINE");
              setOpen(false);
            }}
            className="w-full px-4 py-3 text-left font-bold hover:bg-red-50 transition"
          >
            Online Transfer / UPI
          </button>

          <button
            type="button"
            onClick={() => {
              onChange("CASH");
              setOpen(false);
            }}
            className="w-full px-4 py-3 text-left font-bold hover:bg-red-50 transition"
          >
            Cash Payment
          </button>
        </div>
      )}
    </div>
  );
};

/* ===================== MAIN COMPONENT ===================== */
export const UploadProof: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const auth = { Authorization: `Bearer ${token}` };

  const [months, setMonths] = useState<MonthData[]>([]);
  const [selected, setSelected] = useState<MonthData | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethodType>("ONLINE");
  const [year, setYear] = useState(new Date().getFullYear());
  const [rentFile, setRentFile] = useState<File | null>(null);
  const [electricFile, setElectricFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [rentPreview, setRentPreview] = useState<string | null>(null);
  const [electricPreview, setElectricPreview] = useState<string | null>(null);
  const yearPickerRef = useRef<HTMLInputElement | null>(null);
  const monthsFetchedYearRef = useRef<number | null>(null);
const selectedMonthRef = useRef<number | null>(null);

  // Cleanup Preview URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (rentPreview) URL.revokeObjectURL(rentPreview);
      if (electricPreview) URL.revokeObjectURL(electricPreview);
    };
  }, [rentPreview, electricPreview]);

const fetchMonths = async (selectFirst = false) => {
  const res = await axios.get(
    `${BASE_URL}/user/payments/year/${year}`,
    { headers: auth }
  );

  const updatedMonths: MonthData[] = res.data.data.months;
  setMonths(updatedMonths);

  // 🔑 CRITICAL FIX
  if (selected) {
    const updatedSelected = updatedMonths.find(
      m => m.monthNumber === selected.monthNumber
    );
    if (updatedSelected) {
      setSelected(updatedSelected);
    }
  } else if (selectFirst && updatedMonths.length > 0) {
    setSelected(updatedMonths[0]);
    selectedMonthRef.current = updatedMonths[0].monthNumber;
  }
};



  const handleRemove = (type: 'rent' | 'electric') => {
    if (type === 'rent') {
      if (rentPreview) URL.revokeObjectURL(rentPreview);
      setRentFile(null);
      setRentPreview(null);
    } else {
      if (electricPreview) URL.revokeObjectURL(electricPreview);
      setElectricFile(null);
      setElectricPreview(null);
    }
  };

const selectMonth = async (m: MonthData) => {
  if (selectedMonthRef.current === m.monthNumber) return;

  selectedMonthRef.current = m.monthNumber;

  setSelected(m);
  setSidebar(false);
  handleRemove("rent");
  handleRemove("electric");


    setAmount("");
    setMethod("ONLINE");
  
};


  const upload = async () => {
    if (!selected || !amount) return alert("Amount required");
    if (method === "ONLINE" && !rentFile) return alert("Rent screenshot required");
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("amount", amount);
      fd.append("month", selected.monthNumber.toString());
      fd.append("year", year.toString());
      fd.append("paymentMethod", method);

      if (method === "ONLINE") {
        if (rentFile) fd.append("rentBillScreenshot", rentFile);
        if (electricFile) fd.append("electricityBillScreenshot", electricFile);
        await axios.post(`${BASE_URL}/user/payments/upload/online`, fd, { headers: auth });
      } else {
        await axios.post(`${BASE_URL}/user/payments/upload/cash`, 
          { amount, month: selected.monthNumber, year, paymentMethod: method }, 
          { headers: auth }
        );
      }

      alert("Payment submitted successfully!");
      // This re-fetches data and refreshes the 'selected' state automatically
      await fetchMonths();
      handleRemove('rent');
      handleRemove('electric');
    } catch (err) {
      alert("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  if (monthsFetchedYearRef.current === year) return;

  monthsFetchedYearRef.current = year;
  fetchMonths(true);
}, [year]);

useEffect(() => {
  selectedMonthRef.current = null;
}, [year]);

  const isPending = selected?.status === "Pending" || selected?.status === "Under Review";

  const getStatusClasses = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved": return "bg-green-50 border-green-200 text-green-700";
      case "rejected": return "bg-red-50 border-red-200 text-red-700";
      case "pending":
      case "under review": return "bg-orange-50 border-orange-200 text-orange-700";
      default: return "bg-white border-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      {/* Mobile Toggle */}
      <button
        className={`${sidebar ? "hidden" : "md:hidden"} fixed top-1 right-8 bg-red-600 rounded-full p-2.5 z-50 shadow-2xl`}
        onClick={() => setSidebar(true)}
      >
        <Menu className="text-white" size={24} />
      </button>

      {/* Sidebar Navigation */}
      <aside className={`fixed md:static right-0 top-0 h-full w-90 bg-white p-6 shadow-2xl z-40 transform transition-transform duration-300 ${sidebar ? "translate-x-0" : "translate-x-full md:translate-x-0"}`}>
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-black text-xl text-gray-900 tracking-tight">Timeline</h3>
          <button className="md:hidden p-2 hover:bg-gray-100 rounded-full" onClick={() => setSidebar(false)}><X size={20}/></button>
        </div>

        {/* Year Picker */}
        <div className="relative mb-8">
          <input ref={yearPickerRef} type="date" onChange={(e) => setYear(new Date(e.target.value).getFullYear())} className="absolute inset-0 opacity-0 cursor-pointer" />
          <div className="flex items-center border-2 rounded-xl px-4 py-3 bg-white hover:border-red-400 transition-colors cursor-pointer">
            <span className="flex-1 font-bold text-gray-700">{year}</span>
            <CalendarIcon className="text-red-500" size={20} />
          </div>
        </div>

        {/* Month List */}
        <div className="space-y-3 pl-1  overflow-y-auto max-h-[calc(100vh-250px)] pr-2  custom-scrollbar">
          {months.map((m) => {
            const isSel = selected?.monthNumber === m.monthNumber;
            return (
              <button
                key={m.monthNumber}
                onClick={() => selectMonth(m)}
                className={`w-full p-4 rounded-xl border-2 text-left  transition-all flex flex-col gap-2 ${isSel ? " ring-red-50 shadow-lg scale-[1.02]" : "hover:border-gray-300"} ${getStatusClasses(m.status)}`}
              >
                <div className="flex justify-between items-start w-full">
                  <span className="font-black text-lg">{m.month}</span>
                  <StatusBadge title={m.status} />
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 lg:p-16 overflow-y-auto">
        <button onClick={() => navigate(-1)} className="group text-gray-500 font-bold hover:text-red-600 transition-colors mb-8 flex items-center gap-2">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard
        </button>

        <h2 className="text-4xl font-black text-gray-900 mb-8 tracking-tight">Payment Submission</h2>

        {selected && (
          <div key={`${selected.monthNumber}-${selected.status}`} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-10 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center border-b pb-6 mb-6">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Billing Period</p>
                <h3 className="text-2xl font-black text-gray-800">{selected.month}</h3>
              </div>
              <StatusBadge title={selected.status} />
            </div>

            {isPending ? (
              <div className="flex items-start gap-4 bg-orange-50 p-4 rounded-xl border border-orange-100">
                <div className="p-2 bg-orange-100 rounded-lg text-orange-600 animate-pulse"><CalendarIcon size={20}/></div>
                <div>
                  <p className="font-bold text-orange-800">Verification in Progress</p>
                  <p className="text-sm text-orange-700/80">Your submission is being reviewed by the admin. Editing is locked during this stage.</p>
                </div>
              </div>
            ) : selected.status === "Approved" ? (
              <div className="flex items-start gap-4 bg-green-50 p-4 rounded-xl border border-green-100">
                <CheckCircle2 className="text-green-500 mt-1" size={24}/>
                <div>
                  <p className="font-bold text-green-800">Payment Approved</p>
                  <p className="text-sm text-green-700/80">Everything looks good! This month is cleared.</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Please provide accurate payment details and upload high-quality screenshots for faster approval.</p>
            )}
          </div>
        )}

        {/* Form Section */}
        {selected && (selected.status === "No Payment" || selected.status === "Rejected") && (
          <div className="space-y-8 max-w-2xl">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-widest text-gray-500">Total Amount</label>
                <input
                  type="text"
                  placeholder="₹ 0.00"
                  value={amount}
                  onChange={(e) => /^\d*$/.test(e.target.value) && setAmount(e.target.value)}
                  className="w-full bg-white border-2 border-gray-100 p-4 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-50 outline-none transition-all text-lg font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-widest text-gray-500">Method</label>
              <PaymentMethodDropdown
  value={method}
  onChange={setMethod}
  disabled={loading}
/>

              </div>
            </div>

            {method === "ONLINE" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                <div className="space-y-4">
                  <FileUpload label="Rent Receipt" onSelect={(f) => { if(f){setRentFile(f); setRentPreview(URL.createObjectURL(f))} }} />
                  {rentPreview && (
                    <div className="relative group rounded-2xl overflow-hidden border-2 border-red-100">
                      <img src={rentPreview} className="w-full h-48 object-cover" alt="Rent" />
                      <button onClick={() => handleRemove('rent')} className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-lg text-red-500 hover:bg-red-50 transition-colors"><X size={18}/></button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <FileUpload label="Electricity Receipt" onSelect={(f) => { if(f){setElectricFile(f); setElectricPreview(URL.createObjectURL(f))} }} />
                  {electricPreview && (
                    <div className="relative group rounded-2xl overflow-hidden border-2 border-red-100">
                      <img src={electricPreview} className="w-full h-48 object-cover" alt="Electric" />
                      <button onClick={() => handleRemove('electric')} className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-lg text-red-500 hover:bg-red-50 transition-colors"><X size={18}/></button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={upload}
              disabled={loading}
              className="w-full md:w-auto px-1 py-5 bg-red-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-red-200 hover:bg-red-700 hover:-translate-y-1 active:translate-y-0 disabled:bg-gray-300 disabled:shadow-none transition-all flex items-center justify-center gap-3"
            >
              {loading ? <div className="w-4 h-4 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : "Submit Proof"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};