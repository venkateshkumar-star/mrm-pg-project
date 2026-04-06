// import React, { useState, useEffect, useCallback, useRef } from "react";
// import axios from "axios";
// import { BASE_URL } from "../navigation/Navigation";
// import { format } from "date-fns";

// /* ---------- TYPES ---------- */
// type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "SETTLED";

// interface LeavingRequest {
//   id: string;
//   requestedLeaveDate: string;
//   reason: string;
//   status: RequestStatus;
//   pendingDues: number | null;
//   createdAt: string;
//   memberName: string;
// }

// interface ApiResponse<T> {
//   success: boolean;
//   message: string;
//   data: T;
// }

// const getToken = () => localStorage.getItem("token");

// /* ---------- STATUS BADGE ---------- */
// const StatusBadge = ({ status }: { status: RequestStatus }) => {
//   const map: Record<RequestStatus, string> = {
//     PENDING: "bg-yellow-100 text-yellow-800",
//     APPROVED: "bg-blue-100 text-blue-800",
//     REJECTED: "bg-red-100 text-red-800",
//     SETTLED: "bg-green-100 text-green-800",
//   };

//   return (
//     <span className={`px-3 py-1 rounded-full text-xs font-bold ${map[status]}`}>
//       {status}
//     </span>
//   );
// };

// /* ---------- MAIN COMPONENT ---------- */
// export const LeavingRequestStatus: React.FC = () => {
//   const [requests, setRequests] = useState<LeavingRequest[]>([]);
//   const [view, setView] = useState<"status" | "form">("status");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const [form, setForm] = useState({
//     leaveDate: "",
//     reason: "", 
//     confirm: false,
//   });

//   const didFetchRef = useRef(false);

//   /* ---------- FETCH REQUESTS (ONCE) ---------- */
//   const fetchRequests = useCallback(async () => {
//     const token = getToken();
//     if (!token) return;

//     try {
//       const res = await axios.get<ApiResponse<LeavingRequest[]>>(
//         `${BASE_URL}/user/leaving-requests/status`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       if (res.data.success) {
//         setRequests(res.data.data);
//         if (res.data.data.length > 0) {
//           setView("status");
//         }
//       }
//     } catch {
//       setError("Failed to load requests");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   /* ---------- STRICT MODE SAFE EFFECT ---------- */
//   useEffect(() => {
//     if (didFetchRef.current) return;
//     didFetchRef.current = true;
//     fetchRequests();
//   }, [fetchRequests]);

//   /* ---------- DERIVED STATE ---------- */
//   const hasRequest = requests.length > 0;

//   /* ---------- SUBMIT ---------- */
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);

//     if (!form.leaveDate || form.reason.length < 10 || !form.confirm) {
//       setError("Please complete all fields correctly.");
//       return;
//     }

//     if (hasRequest) {
//       setError("You can submit only one request.");
//       return;
//     }

//     try {
//       const token = getToken();
//       if (!token) return;

//       const res = await axios.post<ApiResponse<any>>(
//         `${BASE_URL}/user/leaving-requests/apply`,
//         {
//           requestedLeaveDate: form.leaveDate,
//           reason: form.reason,
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       if (res.data.success) {
//         alert("Request submitted successfully!");
//         await fetchRequests(); // 🔥 refresh state
//         setView("status");
//       } else {
//         setError(res.data.message);
//       }
//     } catch {
//       setError("Submission failed");
//     }
//   };

//   /* ---------- FORM BLOCK (HARD STOP) ---------- */
//   if (view === "form" && hasRequest) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="bg-white p-8 rounded-xl shadow-md text-center">
//           <h2 className="text-xl font-bold mb-2">Request Already Submitted</h2>
//           <p className="text-gray-600 mb-4">
//             You can submit only one release request.
//           </p>
//           <button
//             onClick={() => setView("status")}
//             className="px-6 py-3 bg-red-600 text-white rounded-lg"
//           >
//             View Status
//           </button>
//         </div>
//       </div>
//     );
//   }

//   /* ---------- LOADING ---------- */
//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         Loading...
//       </div>
//     );
//   }

//   /* ---------- STATUS VIEW ---------- */
//   if (view === "status") {
//     return (
//       <div className="min-h-screen bg-gray-50 p-6">
//         <div className="max-w-4xl mx-auto bg-white rounded-xl shadow">
//           <div className="p-6 border-b">
//             <h1 className="text-2xl font-bold">Release Request Status</h1>
//           </div>

//           {requests.length === 0 ? (
//             <div className="p-6 text-center">
//               <p className="mb-4 text-gray-600">
//                 No request submitted yet.
//               </p>
//               <button
//                 onClick={() => setView("form")}
//                 className="px-6 py-3 bg-red-600 text-white rounded-lg"
//               >
//                 Submit Request
//               </button>
//             </div>
//           ) : (
//             <table className="w-full text-sm">
//               <thead className="bg-gray-100">
//                 <tr>
//                   <th className="p-3 text-left">Date</th>
//                   <th className="p-3 text-left">Leave Date</th>
//                   <th className="p-3 text-left">Status</th>
//                   <th className="p-3 text-right">Pending</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {requests.map(r => (
//                   <tr key={r.id} className="border-t">
//                     <td className="p-3">
//                       {format(new Date(r.createdAt), "dd MMM yyyy")}
//                     </td>
//                     <td className="p-3">
//                       {format(new Date(r.requestedLeaveDate), "dd MMM yyyy")}
//                     </td>
//                     <td className="p-3">
//                       <StatusBadge status={r.status} />
//                     </td>
//                     <td className="p-3 text-right">
//                       {r.pendingDues ? `₹${r.pendingDues}` : "N/A"}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </div>
//     );
//   }

//   /* ---------- FORM VIEW ---------- */
//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow">
//         <h1 className="text-2xl font-bold mb-4">Release Request</h1>

//         {error && (
//           <div className="mb-4 text-red-600 font-medium">{error}</div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <input
//             type="date"
//             value={form.leaveDate}
//             onChange={e => setForm({ ...form, leaveDate: e.target.value })}
//             className="w-full p-3 border rounded"
//             required
//           />

//           <textarea
//             placeholder="Reason (min 10 characters)"
//             value={form.reason}
//             onChange={e => setForm({ ...form, reason: e.target.value })}
//             className="w-full p-3 border rounded"
//             minLength={10}
//             required
//           />

//           <label className="flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={form.confirm}
//               onChange={e => setForm({ ...form, confirm: e.target.checked })}
//             />
//             I confirm the information is correct
//           </label>

//           <button
//             type="submit"
//             className="w-full py-3 bg-red-600 text-white rounded-lg"
//           >
//             Submit Request
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };


import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { BASE_URL } from "../navigation/Navigation";
import { format } from "date-fns";

/* ================= TYPES ================= */

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "SETTLED";

interface LeavingRequest {
  id: string;
  requestedLeaveDate: string;
  reason: string;
  status: RequestStatus;
  pendingDues: number | null;
  finalAmount: number | null;
  createdAt: string;
  memberName: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const getToken = () => localStorage.getItem("token");

/* ================= MAIN ================= */

export const LeavingRequestStatus: React.FC = () => {
  const [requests, setRequests] = useState<LeavingRequest[]>([]);
  const [view, setView] = useState<"status" | "form">("status");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    leaveDate: "",
    reason: "",
    confirm: false,
  });

  const fetchedOnce = useRef(false);

  /* ============ FETCH STATUS (ONLY ONCE) ============ */
  const fetchRequests = useCallback(async () => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;

    try {
      const token = getToken();
      const res = await axios.get<ApiResponse<LeavingRequest[]>>(
        `${BASE_URL}/user/leaving-requests/status`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setRequests(res.data.data);

        // Auto-lock form if any request exists
        if (res.data.data.length > 0) {
          setView("status");
        }
      } else {
        setError(res.data.message);
      }
    } catch (err: any) {
      setError("Failed to load request status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  /* ============ COMPUTED STATES ============ */
  const hasRequest = requests.length > 0;
  const activeRequest = requests[0];

  const payableAmount =
    activeRequest?.status === "APPROVED"
      ? activeRequest.finalAmount
      : activeRequest?.pendingDues;

  /* ============ SUBMIT FORM ============ */
  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.confirm) {
      setError("Please confirm the declaration");
      return;
    }

    try {
      const token = getToken();
      const res = await axios.post(
        `${BASE_URL}/user/leaving-requests/apply`,
        {
          requestedLeaveDate: form.leaveDate,
          reason: form.reason,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        alert("Request submitted successfully");
        fetchedOnce.current = false;
        setLoading(true);
        fetchRequests();
      } else {
        setError(res.data.message);
      }
    } catch {
      setError("Submission failed");
    }
  };

  /* ============ UI ============ */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  /* ================= STATUS VIEW ================= */
  if (hasRequest) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Release Request Status</h1>

          <div className="space-y-3">
            <p>
              <strong>Status:</strong>{" "}
              <span className="font-bold">{activeRequest.status}</span>
            </p>

            <p>
              <strong>Requested On:</strong>{" "}
              {format(new Date(activeRequest.createdAt), "dd MMM yyyy")}
            </p>

            <p>
              <strong>Leave Date:</strong>{" "}
              {format(new Date(activeRequest.requestedLeaveDate), "dd MMM yyyy")}
            </p>

            <p>
              <strong>Payable Amount:</strong>{" "}
              <span className="font-bold text-red-600">
                ₹{payableAmount ?? 0}
              </span>
            </p>

            <p className="text-sm text-gray-500">
              You can submit only one release request. Please wait until it is
              fully processed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ================= FORM VIEW ================= */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Apply for Release</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={submitRequest} className="space-y-6">
          <div>
            <label className="block font-medium mb-1">Leave Date</label>
            <input
              type="date"
              required
              value={form.leaveDate}
              onChange={(e) =>
                setForm({ ...form, leaveDate: e.target.value })
              }
              className="w-full border px-4 py-2 rounded"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Reason</label>
            <textarea
              required
              minLength={10}
              value={form.reason}
              onChange={(e) =>
                setForm({ ...form, reason: e.target.value })
              }
              className="w-full border px-4 py-2 rounded"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.confirm}
              onChange={(e) =>
                setForm({ ...form, confirm: e.target.checked })
              }
            />
            I confirm all dues will be cleared
          </label>

          <button
            type="submit"
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
          >
            Submit Request
          </button>
        </form>
      </div>
    </div>
  );
};


