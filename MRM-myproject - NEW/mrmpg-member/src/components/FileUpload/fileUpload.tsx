import React, { useRef, useState, ChangeEvent } from "react";

interface FileUploadProps {
  uploadElectricText: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  uploadElectricText,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setFile(selectedFile);
  };

  const handleCancel = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div style={{ width: "100%", maxWidth: "900px" }}>
      <h2 style={{ marginBottom: "16px" }}>{uploadElectricText}</h2>

      <div
        style={{
          border: "1px solid #E5E7EB",
          borderRadius: "12px",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#FAFAFA",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {file && (
            <>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  background: "#F3F4F6",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                }}
              >
                📄
              </div>

              <div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#111827",
                  }}
                >
                  {file.name}
                </div>
                <div style={{ fontSize: "13px", color: "#6B7280" }}>
                  {formatFileSize(file.size)}
                </div>
              </div>
            </>
          )}
          {!file && (
            <div style={{ fontSize: "14px", color: "#6B7280" }}>
              No file selected
            </div>
          )}
        </div>

        <div>
          {!file ? (
            <button
              type="button"
              onClick={handleChooseFile}
              style={{
                background: "#f0645a",
                color: "#fff",
                border: "none",
                borderRadius: "24px",
                padding: "12px 20px",
                fontSize: "15px",
                cursor: "pointer",
              }}
            >
              Choose File
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancel}
              style={{
                background: "#EF4444",
                color: "#fff",
                border: "none",
                borderRadius: "24px",
                padding: "12px 20px",
                fontSize: "15px",
                cursor: "pointer",
              }}
            >
              ✕ Cancel
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, application/pdf"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
};
