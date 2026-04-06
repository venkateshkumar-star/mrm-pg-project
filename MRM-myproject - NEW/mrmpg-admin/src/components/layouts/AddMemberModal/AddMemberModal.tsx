import React, { useState, useCallback, useEffect } from "react";
import ui from "@/components/ui";
import { useNotification } from "@/hooks/useNotification";
import { ApiClient } from "@/utils";
import "./AddMemberModal.scss";

interface PGOption {
    value: string;
    label: string;
    type: string;
}

interface RoomOption {
    value: string;
    label: string;
    capacity: number;
    currentOccupancy: number;
    isAvailable: boolean;
}

interface AddMemberFormData {
    name: string;
    dob: string;
    location: string;
    email: string;
    phone: string;
    work: string;
    rentType: string;
    rentAmount: number;
    advanceAmount: number;
    pricePerDay: number;
    dateOfRelieving: string;
    pgId: string;
    roomId: string;
    dateOfJoining: string;
    profileImage: File | null;
    documentImage: File | null;
}

interface AddMemberApiData {
    name: string;
    dob: string;
    location: string;
    email: string;
    phone: string;
    work: string;
    rentType: string;
    rentAmount: number;
    advanceAmount: number;
    pricePerDay?: number;
    dateOfRelieving?: string;
    pgId: string;
    roomId: string;
    dateOfJoining: string;
    profileImage: File | null;
    documentImage: File | null;
}

interface FormErrors {
    name?: string;
    dob?: string;
    location?: string;
    email?: string;
    phone?: string;
    work?: string;
    rentType?: string;
    rentAmount?: string;
    advanceAmount?: string;
    pricePerDay?: string;
    dateOfRelieving?: string;
    pgId?: string;
    roomId?: string;
    dateOfJoining?: string;
    profileImage?: string;
    documentImage?: string;
}

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (memberData: FormData) => Promise<void>;
    loading?: boolean;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
    isOpen,
    onClose,
    onSave,
    loading = false
}) => {
    const notification = useNotification();
    
    const [formData, setFormData] = useState<AddMemberFormData>({
        name: '',
        dob: '',
        location: '',
        email: '',
        phone: '',
        work: '',
        rentType: 'LONG_TERM',
        rentAmount: 0,
        advanceAmount: 0,
        pricePerDay: 0,
        dateOfRelieving: '',
        pgId: '',
        roomId: '',
        dateOfJoining: new Date().toISOString().split('T')[0],
        profileImage: null,
        documentImage: null
    });

    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [pgOptions, setPgOptions] = useState<PGOption[]>([]);
    const [roomOptions, setRoomOptions] = useState<RoomOption[]>([]);
    const [pgLoading, setPgLoading] = useState(false);
    const [roomsLoading, setRoomsLoading] = useState(false);

    // Fetch PG options
    const fetchPGOptions = useCallback(async () => {
        setPgLoading(true);
        try {
            const response = await ApiClient.get('/filters/admin-pg-locations') as {
                success: boolean;
                data?: {
                    options: Array<{ value: string; label: string; type: string }>;
                };
                message?: string;
                error?: string;
            };

            if (response.success && response.data) {
                setPgOptions(response.data.options || []);
            } else {
                notification.showError(
                    response.error || "Failed to fetch PG options",
                    response.message,
                    5000
                );
            }
        } catch (err) {
            notification.showError(
                "Failed to fetch PG options",
                err instanceof Error ? err.message : "Check your internet connection and try again.",
                5000
            );
        } finally {
            setPgLoading(false);
        }
    }, [notification]);

    // Fetch rooms for selected PG
    const fetchRoomsForPG = useCallback(async (pgId: string) => {
        if (!pgId) {
            setRoomOptions([]);
            return;
        }

        setRoomsLoading(true);
        try {
            const response = await ApiClient.get(`/filters/pg/rooms?pgId=${pgId}`) as {
                success: boolean;
                data?: {
                    options: Array<{ 
                        value: string; 
                        label: string; 
                        capacity: number;
                        currentOccupancy: number;
                        isAvailable: boolean;
                    }>;
                };
                message?: string;
                error?: string;
            };

            if (response.success && response.data) {
                setRoomOptions(response.data.options || []);
            } else {
                notification.showError(
                    response.error || "Failed to fetch rooms",
                    response.message,
                    5000
                );
                setRoomOptions([]);
            }
        } catch (err) {
            notification.showError(
                "Failed to fetch rooms",
                err instanceof Error ? err.message : "Check your internet connection and try again.",
                5000
            );
            setRoomOptions([]);
        } finally {
            setRoomsLoading(false);
        }
    }, [notification]);

    // Load PG options when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchPGOptions();
        }
    }, [isOpen, fetchPGOptions]);

    // Load rooms when PG changes
    useEffect(() => {
        if (formData.pgId) {
            fetchRoomsForPG(formData.pgId);
        } else {
            setRoomOptions([]);
        }
    }, [formData.pgId, fetchRoomsForPG]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            // Store original overflow style
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            
            // Cleanup function to restore scroll
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isOpen]);

    // Calculate total days between two dates
    const calculateTotalDays = (startDate: string, endDate: string): number => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays + 1 : 0; // Include both start and end day
    };

    // Calculate rent amount for short-term based on pricePerDay and total days
    const calculatedRentAmount = formData.rentType === 'SHORT_TERM' 
        ? formData.pricePerDay * calculateTotalDays(formData.dateOfJoining, formData.dateOfRelieving)
        : formData.rentAmount;

    const validateForm = (): boolean => {
        const errors: FormErrors = {};

        if (!formData.name.trim()) errors.name = 'Name is required';
        if (!formData.dob) errors.dob = 'Date of birth is required';
        if (!formData.location.trim()) errors.location = 'Location is required';
        if (!formData.email.trim()) errors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }
        if (!formData.phone.trim()) errors.phone = 'Phone number is required';
        else if (!/^\d{10}$/.test(formData.phone)) {
            errors.phone = 'Please enter a valid 10-digit phone number';
        }
        if (!formData.work.trim()) errors.work = 'Work/Occupation is required';
        
        // Validation based on rent type
        if (formData.rentType === 'LONG_TERM') {
            if (!formData.rentAmount || formData.rentAmount <= 0) {
                errors.rentAmount = 'Valid rent amount is required';
            }
        } else {
            // SHORT_TERM validation
            if (!formData.pricePerDay || formData.pricePerDay <= 0) {
                errors.pricePerDay = 'Valid price per day is required';
            }
            if (!formData.dateOfRelieving) {
                errors.dateOfRelieving = 'Date of relieving is required';
            } else if (formData.dateOfJoining && new Date(formData.dateOfRelieving) <= new Date(formData.dateOfJoining)) {
                errors.dateOfRelieving = 'Date of relieving must be after date of joining';
            }
        }
        
        if (formData.advanceAmount < 0) {
            errors.advanceAmount = 'Advance amount cannot be negative';
        }
        if (!formData.pgId) errors.pgId = 'Please select a PG';
        if (!formData.roomId) errors.roomId = 'Please select a room';
        if (!formData.dateOfJoining) errors.dateOfJoining = 'Date of joining is required';
        if (!formData.profileImage) errors.profileImage = 'Profile image is required';
        if (!formData.documentImage) errors.documentImage = 'ID proof document is required';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (field: keyof AddMemberFormData, value: string | number | File | null) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (formErrors[field as keyof FormErrors]) {
            setFormErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleProfileImageChange = (files: File[]) => {
        const file = files.length > 0 ? files[0] : null;
        handleInputChange('profileImage', file);
    };

    const handleDocumentImageChange = (files: File[]) => {
        const file = files.length > 0 ? files[0] : null;
        handleInputChange('documentImage', file);
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        // Create FormData for file uploads
        const formDataToSubmit = new FormData();
        
        // Add all form fields to FormData
        formDataToSubmit.append('name', formData.name);
        formDataToSubmit.append('dob', formData.dob);
        formDataToSubmit.append('location', formData.location);
        formDataToSubmit.append('email', formData.email);
        formDataToSubmit.append('phone', formData.phone);
        formDataToSubmit.append('work', formData.work);
        formDataToSubmit.append('rentType', formData.rentType);
        
        // For short-term, send calculated rent amount, pricePerDay and dateOfRelieving
        if (formData.rentType === 'SHORT_TERM') {
            formDataToSubmit.append('pricePerDay', formData.pricePerDay.toString());
            formDataToSubmit.append('dateOfRelieving', formData.dateOfRelieving);
            formDataToSubmit.append('rentAmount', calculatedRentAmount.toString());
        } else {
            formDataToSubmit.append('rentAmount', formData.rentAmount.toString());
        }
        
        formDataToSubmit.append('advanceAmount', formData.advanceAmount.toString());
        formDataToSubmit.append('pgId', formData.pgId);
        formDataToSubmit.append('roomId', formData.roomId);
        formDataToSubmit.append('dateOfJoining', formData.dateOfJoining);
        
        // Add files with specific field names
        if (formData.profileImage) {
            formDataToSubmit.append('profileImage', formData.profileImage);
        }
        if (formData.documentImage) {
            formDataToSubmit.append('documentImage', formData.documentImage);
        }

        try {
            await onSave(formDataToSubmit);
            // Reset form on successful save
            setFormData({
                name: '',
                dob: '',
                location: '',
                email: '',
                phone: '',
                work: '',
                rentType: 'LONG_TERM',
                rentAmount: 0,
                advanceAmount: 0,
                pricePerDay: 0,
                dateOfRelieving: '',
                pgId: '',
                roomId: '',
                dateOfJoining: new Date().toISOString().split('T')[0],
                profileImage: null,
                documentImage: null
            });
            setFormErrors({});
        } catch {
            // Error handling is done in parent component
        }
    };

    const handleClose = () => {
        // Reset form when closing
        setFormData({
            name: '',
            dob: '',
            location: '',
            email: '',
            phone: '',
            work: '',
            rentType: 'LONG_TERM',
            rentAmount: 0,
            advanceAmount: 0,
            pricePerDay: 0,
            dateOfRelieving: '',
            pgId: '',
            roomId: '',
            dateOfJoining: new Date().toISOString().split('T')[0],
            profileImage: null,
            documentImage: null
        });
        setFormErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="add-member-modal-overlay">
            <div className="add-member-modal">
                <div className="add-member-modal__header">
                    <h2>Add New Member</h2>
                    <button
                        className="add-member-modal__close"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        <ui.Icons name="close" size={20} />
                    </button>
                </div>

                <div className="add-member-modal__content">
                    <div className="add-member-form">
                        {/* Personal Information */}
                        <div className="form-section">
                            <h3>Personal Information</h3>
                            <div className="form-row">
                                <div className="form-field">
                                    <ui.Label required>Full Name</ui.Label>
                                    <ui.Input
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        placeholder="Enter full name"
                                        error={formErrors.name}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="form-field">
                                    <ui.Label required>Date of Birth</ui.Label>
                                    <ui.DateInput
                                        id="dob"
                                        value={formData.dob}
                                        onChange={(value) => handleInputChange('dob', value)}
                                        disabled={loading}
                                    />
                                    {formErrors.dob && <span className="error-text">{formErrors.dob}</span>}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-field">
                                    <ui.Label required>Email</ui.Label>
                                    <ui.Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        placeholder="Enter email address"
                                        error={formErrors.email}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="form-field">
                                    <ui.Label required>Phone Number</ui.Label>
                                    <ui.Input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        placeholder="Enter 10-digit phone number"
                                        error={formErrors.phone}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-field">
                                    <ui.Label required>Location</ui.Label>
                                    <ui.Input
                                        value={formData.location}
                                        onChange={(e) => handleInputChange('location', e.target.value)}
                                        placeholder="Enter location"
                                        error={formErrors.location}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="form-field">
                                    <ui.Label required>Work/Occupation</ui.Label>
                                    <ui.Input
                                        value={formData.work}
                                        onChange={(e) => handleInputChange('work', e.target.value)}
                                        placeholder="Enter work/occupation"
                                        error={formErrors.work}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Accommodation Details */}
                        <div className="form-section">
                            <h3>Accommodation Details</h3>
                            <div className="form-row">
                                <div className="form-field">
                                    <ui.Label required>Rent Type</ui.Label>
                                    <ui.Select
                                        id="rentType"
                                        value={formData.rentType}
                                        onChange={(value) => handleInputChange('rentType', value as string)}
                                        options={[
                                            { value: 'LONG_TERM', label: 'Long Term' },
                                            { value: 'SHORT_TERM', label: 'Short Term' }
                                        ]}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="form-field">
                                    <ui.Label required>Date of Joining</ui.Label>
                                    <ui.DateInput
                                        id="dateOfJoining"
                                        value={formData.dateOfJoining}
                                        onChange={(value) => handleInputChange('dateOfJoining', value)}
                                        disabled={loading}
                                    />
                                    {formErrors.dateOfJoining && <span className="error-text">{formErrors.dateOfJoining}</span>}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-field">
                                    <ui.Label required>PG Location</ui.Label>
                                    <ui.Select
                                        id="pgId"
                                        value={formData.pgId}
                                        onChange={(value) => handleInputChange('pgId', value as string)}
                                        options={pgOptions}
                                        placeholder="Select PG location"
                                        disabled={loading || pgLoading}
                                    />
                                    {formErrors.pgId && <span className="error-text">{formErrors.pgId}</span>}
                                </div>
                                <div className="form-field">
                                    <ui.Label required>Room</ui.Label>
                                    <ui.Select
                                        id="roomId"
                                        value={formData.roomId}
                                        onChange={(value) => handleInputChange('roomId', value as string)}
                                        options={roomOptions}
                                        placeholder={formData.pgId ? "Select room" : "Select PG first"}
                                        disabled={loading || !formData.pgId || roomsLoading}
                                    />
                                    {formErrors.roomId && <span className="error-text">{formErrors.roomId}</span>}
                                    {formData.pgId && roomOptions.length === 0 && !roomsLoading && (
                                        <small className="form-help">No available rooms in this PG</small>
                                    )}
                                </div>
                            </div>

                            {/* Date of Relieving for Short-term */}
                            {formData.rentType === 'SHORT_TERM' && (
                                <div className="form-row">
                                    <div className="form-field">
                                        <ui.Label required>Date of Relieving</ui.Label>
                                        <ui.DateInput
                                            id="dateOfRelieving"
                                            value={formData.dateOfRelieving}
                                            onChange={(value) => handleInputChange('dateOfRelieving', value)}
                                            disabled={loading}
                                            min={formData.dateOfJoining || undefined}
                                        />
                                        {formErrors.dateOfRelieving && <span className="error-text">{formErrors.dateOfRelieving}</span>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Financial Details */}
                        <div className="form-section">
                            <h3>Financial Details</h3>
                            
                            {/* Short-term specific fields */}
                            {formData.rentType === 'SHORT_TERM' && (
                                <>
                                    <div className="form-row">
                                        <div className="form-field">
                                            <ui.Label required>Price Per Day</ui.Label>
                                            <ui.NumberInput
                                                id="pricePerDay"
                                                value={formData.pricePerDay}
                                                onChange={(value) => handleInputChange('pricePerDay', value)}
                                                placeholder="Enter price per day"
                                                disabled={loading}
                                                min={0}
                                            />
                                            {formErrors.pricePerDay && <span className="error-text">{formErrors.pricePerDay}</span>}
                                        </div>
                                        <div className="form-field">
                                            <ui.Label required>Advance Amount</ui.Label>
                                            <ui.NumberInput
                                                id="advanceAmount"
                                                value={formData.advanceAmount}
                                                onChange={(value) => handleInputChange('advanceAmount', value)}
                                                placeholder="Enter advance amount"
                                                disabled={loading}
                                                min={0}
                                            />
                                            {formErrors.advanceAmount && <span className="error-text">{formErrors.advanceAmount}</span>}
                                        </div>
                                    </div>
                                    
                                    {/* Calculated rent display */}
                                    {formData.pricePerDay > 0 && formData.dateOfJoining && formData.dateOfRelieving && (
                                        <div className="calculated-rent-info">
                                            <div className="info-row">
                                                <span className="info-label">Total Days:</span>
                                                <span className="info-value">{calculateTotalDays(formData.dateOfJoining, formData.dateOfRelieving)} days</span>
                                            </div>
                                            <div className="info-row">
                                                <span className="info-label">Calculated Rent:</span>
                                                <span className="info-value highlight">₹{calculatedRentAmount.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            
                            {/* Long-term rent amount field */}
                            {formData.rentType === 'LONG_TERM' && (
                                <div className="form-row">
                                    <div className="form-field">
                                        <ui.Label required>Rent Amount</ui.Label>
                                        <ui.NumberInput
                                            id="rentAmount"
                                            value={formData.rentAmount}
                                            onChange={(value) => handleInputChange('rentAmount', value)}
                                            placeholder="Enter rent amount"
                                            disabled={loading}
                                            min={0}
                                        />
                                        {formErrors.rentAmount && <span className="error-text">{formErrors.rentAmount}</span>}
                                    </div>
                                    <div className="form-field">
                                        <ui.Label required>Advance Amount</ui.Label>
                                        <ui.NumberInput
                                            id="advanceAmount"
                                            value={formData.advanceAmount}
                                            onChange={(value) => handleInputChange('advanceAmount', value)}
                                            placeholder="Enter advance amount"
                                            disabled={loading}
                                            min={0}
                                        />
                                        {formErrors.advanceAmount && <span className="error-text">{formErrors.advanceAmount}</span>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Document Upload */}
                        <div className="form-section">
                            <h3>Documents</h3>
                            <div className="form-row">
                                <div className="form-field">
                                    <ui.Label required>Profile Image</ui.Label>
                                    <ui.ImageUpload
                                        accept="image/*"
                                        maxSize={5 * 1024 * 1024} // 5MB
                                        maxFiles={1}
                                        multiple={false}
                                        onFilesChange={handleProfileImageChange}
                                        disabled={loading}
                                        className="image-upload--profile"
                                    />
                                    {formErrors.profileImage && <span className="error-text">{formErrors.profileImage}</span>}
                                </div>
                                <div className="form-field">
                                    <ui.Label required>ID Proof Document</ui.Label>
                                    <ui.ImageUpload
                                        accept="image/*,application/pdf"
                                        maxSize={10 * 1024 * 1024} // 10MB
                                        maxFiles={1}
                                        multiple={false}
                                        onFilesChange={handleDocumentImageChange}
                                        disabled={loading}
                                        className="image-upload--document"
                                    />
                                    {formErrors.documentImage && <span className="error-text">{formErrors.documentImage}</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="add-member-modal__footer">
                    <ui.Button
                        variant="secondary"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancel
                    </ui.Button>
                    <ui.Button
                        variant="primary"
                        onClick={handleSubmit}
                        loading={loading}
                        disabled={loading}
                    >
                        Add Member
                    </ui.Button>
                </div>
            </div>
        </div>
    );
};

export { AddMemberModal };
export type { AddMemberApiData };
export default AddMemberModal;