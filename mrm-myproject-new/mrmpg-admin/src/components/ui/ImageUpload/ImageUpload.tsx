import React, { useState, useRef, useEffect } from 'react';
import ui from '@/components/ui';
import './ImageUpload.scss';

export interface PendingFile {
    id: string;
    file: File;
    preview: string;
    name: string;
    size: number;
    type: string;
}

export interface UploadedImage {
    id: string;
    fileName: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    url: string;
    uploadedAt: string;
}

export interface ImageUploadProps {
    accept?: string;
    maxSize?: number; // in bytes
    maxFiles?: number;
    multiple?: boolean;
    onFilesChange?: (files: File[]) => void; // New callback for form integration
    onUploadError?: (error: string) => void;
    initialImages?: UploadedImage[];
    disabled?: boolean;
    className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
    accept = 'image/*',
    maxSize = 5 * 1024 * 1024, // 5MB default
    maxFiles = 10,
    multiple = true,
    onFilesChange,
    onUploadError,
    initialImages = [],
    disabled = false,
    className = ''
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [existingImages] = useState<UploadedImage[]>(initialImages);
    const [dragOver, setDragOver] = useState(false);

    // Generate unique ID for files
    const generateId = () => `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // File validation
    const validateFile = (file: File): string | null => {
        const isImage = file.type.startsWith('image/');
        const isPDF = file.type === 'application/pdf';
        
        if (!isImage && !isPDF) {
            return 'Please select only image files or PDF documents';
        }
        
        if (file.size > maxSize) {
            const sizeMB = (maxSize / (1024 * 1024)).toFixed(1);
            return `File size must be less than ${sizeMB}MB`;
        }

        const totalFiles = pendingFiles.length + existingImages.length;
        
        if (!multiple && totalFiles >= 1) {
            return 'Only one file is allowed';
        }

        if (totalFiles >= maxFiles) {
            return `Maximum ${maxFiles} files allowed`;
        }

        return null;
    };

    // Create preview URL for file
    const createPreview = (file: File): string => {
        if (file.type.startsWith('image/')) {
            return URL.createObjectURL(file);
        }
        // For PDFs and other files, return empty string (we'll show icon instead)
        return '';
    };

    // Handle file selection
    const handleFileSelect = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        
        const fileArray = Array.from(files);
        const validFiles: PendingFile[] = [];
        
        for (const file of fileArray) {
            const error = validateFile(file);
            if (error) {
                onUploadError?.(error);
                continue;
            }

            const pendingFile: PendingFile = {
                id: generateId(),
                file,
                preview: createPreview(file),
                name: file.name,
                size: file.size,
                type: file.type
            };
            
            validFiles.push(pendingFile);
        }

        if (validFiles.length > 0) {
            setPendingFiles(prev => {
                const newFiles = multiple ? [...prev, ...validFiles] : validFiles;
                // Notify parent component with the actual File objects
                const allFiles = newFiles.map(f => f.file);
                onFilesChange?.(allFiles);
                return newFiles;
            });
        }

        // Clear input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle button click
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    // Handle drag and drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) {
            setDragOver(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        
        if (disabled) return;
        
        const files = e.dataTransfer.files;
        handleFileSelect(files);
    };

    // Remove pending file
    const handleRemovePending = (fileId: string) => {
        setPendingFiles(prev => {
            const fileToRemove = prev.find(f => f.id === fileId);
            if (fileToRemove?.preview) {
                // Clean up object URL to prevent memory leaks
                URL.revokeObjectURL(fileToRemove.preview);
            }
            
            const newFiles = prev.filter(f => f.id !== fileId);
            // Notify parent component
            const allFiles = newFiles.map(f => f.file);
            onFilesChange?.(allFiles);
            return newFiles;
        });
    };

    // Clean up object URLs on unmount
    useEffect(() => {
        return () => {
            pendingFiles.forEach(file => {
                if (file.preview) {
                    URL.revokeObjectURL(file.preview);
                }
            });
        };
    }, [pendingFiles]);

    // Format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const containerClasses = [
        'image-upload',
        className,
        disabled && 'image-upload--disabled',
        dragOver && 'image-upload--drag-over'
    ].filter(Boolean).join(' ');

    return (
        <div className={containerClasses}>
            {/* Upload Area */}
            <div 
                className="image-upload__drop-zone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="image-upload__upload-area">
                    <ui.Icons name="image" className="image-upload__upload-icon" />
                    <h4 className="image-upload__upload-title">
                        {dragOver ? 'Drop files here' : 'Select Files'}
                    </h4>
                    <p className="image-upload__upload-description">
                        Drag and drop files here, or click to select files
                    </p>
                    <p className="image-upload__upload-info">
                        Supports: Images (JPG, PNG, GIF) & PDF • Max size: {formatFileSize(maxSize)} • {maxFiles} files max
                    </p>
                    
                    <ui.Button
                        variant="primary"
                        onClick={handleUploadClick}
                        disabled={disabled}
                        className="image-upload__upload-btn"
                    >
                        <ui.Icons name="file" />
                        Choose Files
                    </ui.Button>
                </div>

                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="image-upload__file-input"
                    disabled={disabled}
                />
            </div>

            {/* File Preview Grid */}
            {(pendingFiles.length > 0 || existingImages.length > 0) && (
                <div className="image-upload__preview-section">
                    <h5 className="image-upload__preview-title">
                        Selected Files ({pendingFiles.length + existingImages.length})
                    </h5>
                    <div className="image-upload__preview-grid">
                        {/* Existing Images */}
                        {existingImages.map((image) => (
                            <div key={`existing-${image.id}`} className="image-upload__preview-item">
                                <div className="image-upload__preview-container">
                                    {image.mimeType === 'application/pdf' ? (
                                        <div className="image-upload__pdf-preview">
                                            <ui.Icons name="file" className="image-upload__pdf-icon" />
                                            <span className="image-upload__pdf-label">PDF</span>
                                        </div>
                                    ) : (
                                        <img
                                            src={image.url}
                                            alt={image.originalName}
                                            className="image-upload__preview-image"
                                            loading="lazy"
                                        />
                                    )}
                                    <div className="image-upload__preview-overlay">
                                        <span className="image-upload__existing-badge">Existing</span>
                                    </div>
                                </div>
                                <div className="image-upload__preview-info">
                                    <p className="image-upload__preview-name" title={image.originalName}>
                                        {image.originalName}
                                    </p>
                                    <p className="image-upload__preview-size">
                                        {formatFileSize(image.fileSize)}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* Pending Files */}
                        {pendingFiles.map((file) => (
                            <div key={file.id} className="image-upload__preview-item">
                                <div className="image-upload__preview-container">
                                    {file.type === 'application/pdf' ? (
                                        <div className="image-upload__pdf-preview">
                                            <ui.Icons name="file" className="image-upload__pdf-icon" />
                                            <span className="image-upload__pdf-label">PDF</span>
                                        </div>
                                    ) : file.preview ? (
                                        <img
                                            src={file.preview}
                                            alt={file.name}
                                            className="image-upload__preview-image"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="image-upload__pdf-preview">
                                            <ui.Icons name="file" className="image-upload__pdf-icon" />
                                            <span className="image-upload__pdf-label">FILE</span>
                                        </div>
                                    )}
                                    <div className="image-upload__preview-overlay">
                                        <button
                                            type="button"
                                            className="image-upload__remove-btn"
                                            onClick={() => handleRemovePending(file.id)}
                                            title="Remove file"
                                        >
                                            <ui.Icons name="trash" />
                                        </button>
                                    </div>
                                </div>
                                <div className="image-upload__preview-info">
                                    <p className="image-upload__preview-name" title={file.name}>
                                        {file.name}
                                    </p>
                                    <p className="image-upload__preview-size">
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageUpload;