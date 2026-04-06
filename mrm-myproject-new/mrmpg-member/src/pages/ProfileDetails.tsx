import React, { useState, useEffect, useCallback, useMemo } from "react";
import { BASE_URL } from "../navigation/Navigation"; // Assuming this path is correct
import axios from "axios";

/* ===================================================== */
/* TYPE DEFINITIONS & UTILITIES        */
/* ===================================================== */

// Define the expected profile data structure based on your backend
interface ProfileData {
  pgDetails: {
    pgName: string;
    roomNumber: string;
    pgLocation: string;
    dateOfJoining: string; // ISO Date string
    monthlyRent: number;
    advanceAmount: number;
  };
  personalInfo: {
    name: string;
    age: number;
    dob: string; // ISO Date string
    gender: string;
    workType: string;
  };
  contactInfo: {
    phoneNo: string;
    email: string;
    location: string;
  };
}

// Define the form data structure for the modal
interface FormData {
  name: string;
  dob: string; // YYYY-MM-DD format for input[type="date"]
  phone: string;
  location: string; // Corresponds to `location` in the backend update
  work: string; // Corresponds to `work` in the backend update
}

// Utility to format ISO date string to a display format (e.g., 10 Aug 2000)
const formatDateDisplay = (isoDate: string): string => {
  if (!isoDate) return 'N/A';
  const date = new Date(isoDate);
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

// Utility to format ISO date string to input date format (e.g., 2000-08-10)
const formatDateInput = (isoDate: string): string => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    // Get YYYY-MM-DD
    return date.toISOString().split('T')[0];
};

// Utility to format numbers to currency (assuming INR for rent)
const formatCurrency = (amount: number): string => {
    if (typeof amount !== 'number' || isNaN(amount) || amount === null) return 'N/A';
    return `₹${amount.toLocaleString('en-IN')}`;
};

/* ===================================================== */
/*                      INPUT FIELD COMPONENT            */
/* ===================================================== */
const InputField = ({ label, value, readOnly, helper, type = "text", onChange, icon, highlight = false }: any) => (
  <div className="flex flex-col">
    <div className="flex items-center gap-2 mb-2">
      {icon && <span className="text-lg">{icon}</span>}
      <label className="text-gray-700 font-medium text-sm sm:text-base">
        {label}
      </label>
    </div>
    
    <div className="relative">
      {type === "select" ? (
        <select
          disabled={readOnly}
          value={value} // Use value for controlled component, defaultValue for uncontrolled
          onChange={onChange}
          className={`w-full p-3 sm:p-4 border rounded-lg text-sm sm:text-base transition-all duration-200
            ${readOnly 
              ? "bg-gray-50 text-gray-600 cursor-not-allowed border-gray-200 appearance-none" 
              : "bg-white text-gray-900 border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            }
            ${highlight ? "border-red-200 bg-red-50 font-semibold" : ""}`}
        >
          {/* Options provided in original code - you should use the dynamic value from state */}
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
          <option>Prefer not to say</option>
        </select>
      ) : (
        <input
          type={type}
          value={value} // Use value for controlled component
          readOnly={readOnly}
          onChange={onChange}
          className={`w-full p-3 sm:p-4 border rounded-lg text-sm sm:text-base transition-all duration-200
            ${readOnly 
              ? "bg-gray-50 text-gray-600 cursor-not-allowed border-gray-200" 
              : "bg-white text-gray-900 border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            }
            ${highlight ? "border-red-200 bg-red-50 font-semibold" : ""}`}
        />
      )}
      
      {readOnly && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {/* Lock Icon SVG */}
        </div>
      )}
    </div>
    
    {helper && (
      <p className="text-xs sm:text-sm text-gray-500 mt-2 flex items-start gap-1">
        {/* Info Icon SVG */}
        {helper}
      </p>
    )}
  </div>
);

/* ===================================================== */
/*                        MODAL COMPONENT                          */
/* ===================================================== */

interface BasicInfoModalProps {
    profile: ProfileData;
    onClose: () => void;
    onUpdateSuccess: () => void;
}

const BasicInfoModal: React.FC<BasicInfoModalProps> = ({ profile, onClose, onUpdateSuccess }) => {
    
    // Initialize form state from the fetched profile data
    const [form, setForm] = useState<FormData>(() => ({
        name: profile.personalInfo.name,
        // Convert ISO date from backend to YYYY-MM-DD for input type="date"
        dob: formatDateInput(profile.personalInfo.dob), 
        phone: profile.contactInfo.phoneNo,
        location: profile.contactInfo.location, 
        work: profile.personalInfo.workType,   
    }));

    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleChange = (field: keyof FormData, value: string) => {
        setForm(prevForm => ({ ...prevForm, [field]: value }));
        setErrorMessage(null); // Clear error on change
    };

    const handleSave = async () => {
        setIsSaving(true);
        setErrorMessage(null);
        
        // Build the request body with only updatable fields
        const updatePayload = {
            name: form.name,
            dob: form.dob,
            phone: form.phone,
            location: form.location,
            work: form.work,
        };

        try {
            const token = localStorage.getItem("token"); // Get your auth token
            if (!token) throw new Error("Authentication token not found.");
            
            await axios.put(`${BASE_URL}/user/profile`, updatePayload, {
                headers: {
                    Authorization: `Bearer ${token}`, 
                },
            });

            // On success
            onUpdateSuccess(); 
            onClose(); 
        } catch (err: any) {
            console.error('Profile update failed:', err);
            // Extract a user-friendly error message from the response
            setErrorMessage(err.response?.data?.message || 'Failed to update profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                            Update Personal Details
                        </h2>
                        <p className="text-gray-500 text-sm sm:text-base mt-1">
                            Make changes to your personal information
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={isSaving}
                    >
                        {/* Close Icon SVG */}
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 sm:p-8">
                    {errorMessage && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <span className="block sm:inline">{errorMessage}</span>
                        </div>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                        {/* Personal Information */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">
                                Personal Information
                            </h3>
                            
                            <InputField
                                label="Full Name"
                                value={form.name}
                                readOnly={false}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("name", e.target.value)}
                            />

                            <InputField
                                label="Date of Birth"
                                type="date"
                                value={form.dob}
                                readOnly={false}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("dob", e.target.value)}
                            />
                            
                            <InputField
                                label="Work Type"
                                value={form.work} 
                                readOnly={false}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("work", e.target.value)}
                                helper="Select your current occupation"
                            />
                             
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">
                                Contact Information
                            </h3>
                            
                            <InputField
                                label="Phone Number"
                                value={form.phone}
                                readOnly={false}
                                type="tel" 
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("phone", e.target.value)}
                                helper="Must be a unique phone number"
                            />

                            <InputField
                                label="Email Address"
                                value={profile.contactInfo.email} 
                                readOnly={true} // Email is not in your update endpoint
                                helper="Email cannot be changed."
                            />

                            <InputField
                                label="Address"
                                value={form.location} 
                                readOnly={false}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("location", e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors w-full sm:w-auto"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm w-full sm:w-auto disabled:opacity-50"
                        disabled={isSaving}
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
};


/* ===================================================== */
/*                     MAIN COMPONENT                    */
/* ===================================================== */
export const ProfileDetails: React.FC = () => {
  const [openModal, setOpenModal] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const profileFetchedRef = React.useRef(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token"); 
      if (!token) throw new Error("User not authenticated.");

      const response = await axios.get(`${BASE_URL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`, 
        },
      });
      setProfile(response.data.data);
    } catch (err: any) {
      console.error("Failed to fetch profile:", err);
      setError(err.response?.data?.message || 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  }, []);

useEffect(() => {
  if (profileFetchedRef.current) return;

  profileFetchedRef.current = true;
  fetchProfile();
}, [fetchProfile]);

  
  // Memoize the last updated time (for display only)
  const lastUpdated = useMemo(() => new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }), [profile]);


  if (loading) {
    return <div className="p-8 text-center text-lg text-gray-600">Loading profile...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600 text-lg">Error: {error}</div>;
  }
  
  if (!profile) {
      return <div className="p-8 text-center text-gray-500 text-lg">No profile data available.</div>;
  }

  // Destructure for cleaner access
  const { pgDetails, personalInfo, contactInfo } = profile;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
      {/* PAGE TITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
          Personal Details
        </h1>
        <p className="text-gray-500 text-sm sm:text-base mt-1 sm:mt-0">
          Last updated: {lastUpdated}
        </p>
      </div>

      {/* ===================== PG DETAILS (READ ONLY) ===================== */}
      <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6 lg:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4 lg:mb-6">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
            PG Details
          </h2>
          {/* ... Info Block (SVG not included) ... */}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <InputField 
            label="PG Name" 
            value={pgDetails.pgName} 
            readOnly 
          />
          <InputField 
            label="Room Number" 
            value={pgDetails.roomNumber} 
            readOnly 
          />
          <InputField 
            label="Location" 
            value={pgDetails.pgLocation} 
            readOnly 
          />
          <InputField 
            label="Date of Joining" 
            value={formatDateDisplay(pgDetails.dateOfJoining)} 
            readOnly 
          />
          <InputField 
            label="Advance Amount" 
            value={formatCurrency(pgDetails.advanceAmount)} 
            readOnly 
          />
          <InputField 
            label="Monthly Rent" 
            value={formatCurrency(pgDetails.monthlyRent)}
            readOnly 
            highlight
          />
        </div>
      </div>

      {/* ===================== BASIC INFO ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-6 lg:mb-8">
        {/* Left Column: Personal Information */}
        <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Personal Information
            </h2>
            <button
              onClick={() => setOpenModal(true)}
              className="text-red-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <InputField label="Full Name" value={personalInfo.name} readOnly />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <InputField label="Date of Birth" value={formatDateDisplay(personalInfo.dob)} readOnly />
              <InputField label="Age" value={`${personalInfo.age} years`} readOnly />
            </div>
            <InputField label="Gender" value={personalInfo.gender} readOnly />
            <InputField 
              label="Work Type" 
              value={personalInfo.workType} 
              readOnly 
              helper="Work type helps us understand your occupation"
            />
          </div>
        </div>

        {/* Right Column: Contact Information */}
        <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Contact Information
            </h2>
            <button
              onClick={() => setOpenModal(true)}
              className="text-red-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <InputField 
              label="Phone Number" 
              value={contactInfo.phoneNo} 
              readOnly 
            />
            <InputField 
              label="Email Address" 
              value={contactInfo.email} 
              readOnly 
            />
            <InputField 
              label="Address" 
              value={contactInfo.location} 
              readOnly 
            />
          </div>
        </div>
      </div>

      {/* UPDATE BUTTONS (Mobile/Desktop) - Use them to open the modal */}

      {/* MODAL */}
      {openModal && profile && (
        <BasicInfoModal 
          profile={profile}
          onClose={() => setOpenModal(false)} 
          onUpdateSuccess={fetchProfile} // This triggers GET /profile after a successful PUT
        />
      )}
    </div>
  );
};