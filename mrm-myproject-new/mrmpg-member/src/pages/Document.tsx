import React, { useState } from "react";
import axios from "axios";
import { BASE_URL, IMAGE_BASE_URL } from "../navigation/Navigation";
import { EyeIcon,UploadIcon } from "../../public/Icons";
import * as icon from '../../public/Icons'


const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const Document: React.FC = () => {
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState<"signature" | "document" | null>(null);
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // ==================== HELPER FUNCTIONS ====================
  
  // Function to properly combine URLs
  const getFullUrl = (url: string) => {
    if (!url) return "";
    
    // If URL is already absolute, return as-is
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }
    
    // Ensure base URL ends with slash and remove leading slash from path to avoid double slashes
    const base = IMAGE_BASE_URL.endsWith('/') ? IMAGE_BASE_URL : `${IMAGE_BASE_URL}/`;
    const path = url.startsWith('/') ? url.substring(1) : url;
    
    return `${base}${path}`;
  };

  // Function to open URL in new window
  const openInNewWindow = (url: string) => {
    const fullUrl = getFullUrl(url);
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  // Function to create preview URL from file
  const createPreviewUrl = (file: File) => {
    return URL.createObjectURL(file);
  };

  // Function to handle file selection for preview
  const handleFileSelect = (file: File | null, type: "signature" | "document") => {
    if (file) {
      if (type === "signature") {
        setSignatureFile(file);
      } else {
        setDocumentFile(file);
      }
      
      const preview = createPreviewUrl(file);
      setPreviewUrl(preview);
      setModalType(type);
      setOpenModal(true);
    }
  };

  // ==================== FETCH FUNCTIONS ====================
  
  const fetchSignature = async () => {
    try {
      setLoading(true);
      setImgError(false);

      const res = await axios.get(
        `${BASE_URL}/user/digital-signature`,
        { headers: authHeader() }
      );

      const url = res.data?.data?.digitalSignatureUrl;

       
      if (!url) {
        alert("No signature uploaded");
        return;
      }

      // Open signature in new window
      openInNewWindow(url);
    } catch (err: any) {
      console.error("Signature fetch error", err);
      alert(`Error fetching signature: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocument = async () => {
    try {
      setLoading(true);
      setImgError(false);

      const res = await axios.get(
        `${BASE_URL}/user/document-proof`,
        { headers: authHeader() }
      );

      const url = res.data?.data?.documentUrl;
      console.log("DOC API Response:", { 
        data: res.data, 
        url,
        fullUrl: getFullUrl(url || "")
      });
  
      if (!url) {
        alert("No document uploaded");
        return;
      }

      // Open document in new window
      openInNewWindow(url);
    } catch (err: any) {
      console.error("Document fetch error", err);
      alert(`Error fetching document: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ==================== UPLOAD FUNCTIONS ====================

  const uploadSignature = async () => {
    if (!signatureFile) return alert("Select signature file");

    const fd = new FormData();
    fd.append("digitalSignature", signatureFile);

    try {
      setLoading(true);
      await axios.put(`${BASE_URL}/user/digital-signature`, fd, {
        headers: { ...authHeader(), "Content-Type": "multipart/form-data" },
      });
      alert("Signature uploaded successfully!");
      setOpenModal(false);
      setSignatureFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } catch (err: any) {
      console.error("Upload error", err);
      alert(`Upload failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async () => {
    if (!documentFile) return alert("Select document");

    const fd = new FormData();
    fd.append("documentProof", documentFile);

    try {
      setLoading(true);
      await axios.put(`${BASE_URL}/user/document-proof`, fd, {
        headers: { ...authHeader(), "Content-Type": "multipart/form-data" },
      });
      alert("Document uploaded successfully!");
      setOpenModal(false);
      setDocumentFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } catch (err: any) {
      console.error("Upload error", err);
      alert(`Upload failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER FUNCTION ====================

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Documents</h1>

      {/* SIGNATURE SECTION */}
      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="font-semibold mb-3">Digital Signature</h2>
        <div className="flex items-center space-x-2 mb-4">
       <EyeIcon    onClick={fetchSignature}
            className="text-blue-600 underline hover:text-blue-800"
            disabled={loading}/>
          <button
            onClick={fetchSignature}
            className="text-blue-600 underline hover:text-blue-800"
            disabled={loading}
            
          >
            View Signature
          </button>
          {loading && <span className="text-gray-500">Loading...</span>}
        </div>
        
        <div className="mt-4">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null, "signature")}
            className="mb-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          <button
            onClick={uploadSignature}
            disabled={loading || !signatureFile}
            className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50 transition-colors"
          >
            {loading ? "Uploading..." : "Upload / Update"}
          </button>
        </div>
      </div>

      {/* DOCUMENT SECTION */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="font-semibold mb-3">Document Proof</h2>
        <div className="flex items-center space-x-2 mb-4">
          <EyeIcon   onClick={fetchDocument}
            className="text-blue-600 underline hover:text-blue-800"
            disabled={loading}/>
          <button
            onClick={fetchDocument}
            className="text-blue-600 underline hover:text-blue-800"
            disabled={loading}
          >
            View Document
          </button>
          {loading && <span className="text-gray-500">Loading...</span>}
        </div>
        
        <div className="mt-4">
          <input
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null, "document")}
            className="mb-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button
            onClick={uploadDocument}
            disabled={loading || !documentFile}
            className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50 transition-colors"
          >
            {loading ? "Uploading..." : "Upload / Update"}
          </button>
        </div>
      </div>
      {/* PREVIEW MODAL */}
      {openModal && previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto relative">
            <button
              onClick={() => {
                setOpenModal(false);
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">
              {modalType === "signature" ? "Signature Preview" : "Document Preview"}
            </h2>

            {/* PREVIEW CONTENT */}
            <div className="flex flex-col items-center">
              {modalType === "signature" && previewUrl && (
                <img
                  src={previewUrl}
                  alt="Signature Preview"
                  className="max-w-full max-h-[60vh] object-contain border rounded shadow-lg"
                  onError={() => setImgError(true)}
                />
              )}

              {modalType === "document" && previewUrl && (
                <>
                  {documentFile?.type === 'application/pdf' ? (
                    <iframe
                      src={previewUrl}
                      className="w-full h-[60vh] border rounded shadow-lg"
                      title="Document Preview"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Document Preview"
                      className="max-w-full max-h-[60vh] object-contain border rounded shadow-lg"
                      onError={() => setImgError(true)}
                    />
                  )}
                </>
              )}

              <div className="mt-4 text-sm text-gray-600">
                <p>File: <span className="font-medium">{modalType === "signature" ? signatureFile?.name : documentFile?.name}</span></p>
                <p>Size: <span className="font-medium">
                  {modalType === "signature" 
                    ? (signatureFile?.size ? `${(signatureFile.size / 1024).toFixed(2)} KB` : 'Unknown')
                    : (documentFile?.size ? `${(documentFile.size / 1024).toFixed(2)} KB` : 'Unknown')
                  }
                </span></p>
                <p className="mt-2">This is a preview of the file you selected. Click "Upload" to save it.</p>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={() => {
                  setOpenModal(false);
                  URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (modalType === "signature") {
                    uploadSignature();
                  } else {
                    uploadDocument();
                  }
                }}
                disabled={loading}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50 transition-colors"
              >
                {loading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};