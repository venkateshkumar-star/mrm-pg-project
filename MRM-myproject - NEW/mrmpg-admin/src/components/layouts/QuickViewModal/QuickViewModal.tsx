import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./QuickViewModal.scss";
import ui from "@/components/ui";
import type { QuickViewMemberData } from "@/types/apiResponseTypes";
import { ApiClient } from "@/utils";
import { useNotification } from "@/hooks/useNotification";

// Type for PG location option from API
interface PgLocationOption {
    value: string;
    label: string;
    pgName: string;
    pgType: string;
}

// Type for PG locations API response
interface PgLocationsApiResponse {
    success: boolean;
    message?: string;
    data?: {
        options: PgLocationOption[];
    }
}

// Type for room data from API
interface RoomData {
    value: string;
    label: string;
    capacity: number;
    currentOccupancy: number;
    isAvailable: boolean;
}

// Type for room API response
interface RoomApiResponse {
    success: boolean;
    message?: string;
    data?: {
        options: RoomData[];
        pgInfo: {
            id: string;
            name: string;
            location: string;
            type: string;
        };
    }
}

interface QuickViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    modelLayouts: {
        paymentInfo?: boolean,
        documents?: boolean,
        approvalForm?: boolean,
        showViewProfile?: boolean,
    };
    memberData: QuickViewMemberData | null;
    onDeleteUser?: (userId: string) => void;
    onApproveUser?: (userId: string, pgId: string, formData: { roomId: string; rentAmount?: string; pricePerDay?: string; advanceAmount?: string; pgLocation: string; dateOfJoining?: string; dateOfRelieving?: string }) => void;
    onRejectUser?: (userId: string) => void;
    approveLoading?: boolean;
    rejectLoading?: boolean;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({
    isOpen,
    onClose,
    memberData,
    onApproveUser,
    onRejectUser,
    modelLayouts,
    approveLoading = false,
    rejectLoading = false
}) => {
    // Document viewer state
    const [documentViewer, setDocumentViewer] = useState<{
        isOpen: boolean;
        imageUrl: string;
        title: string;
    }>({
        isOpen: false,
        imageUrl: '',
        title: ''
    });

    // Form state for approval
    const [formData, setFormData] = useState({
        roomNo: '',
        rentAmount: '',
        pricePerDay: '',
        advanceAmount: '',
        pgLocation: memberData?.pgLocation || '',
        dateOfJoining: '',
        dateOfRelieving: ''
    });

    // Form validation errors
    const [formErrors, setFormErrors] = useState({
        roomNo: '',
        rentAmount: '',
        pricePerDay: '',
        pgLocation: ''
    });

    // PG locations data and loading state
    const [pgLocations, setPgLocations] = useState<PgLocationOption[]>([]);
    const [pgLocationsLoading, setPgLocationsLoading] = useState(false);

    // Room data and loading state
    const [roomData, setRoomData] = useState<RoomData[]>([]);
    const [roomsLoading, setRoomsLoading] = useState(false);

    // Store the selected pgId
    const [selectedPgId, setSelectedPgId] = useState<string>('');

    // To handle the notification
    const notification = useNotification();

    // Navigation hook
    const navigate = useNavigate();

    // Function to fetch PG location options based on memberData
    const fetchPgLocations = useCallback(async () => {
        if (!memberData) return;
        setPgLocationsLoading(true);
        try {
            const response = await ApiClient.get(`/filters/admin-pg-locations`) as PgLocationsApiResponse;

            if (response && response.success && response.data) {
                setPgLocations(response.data.options);
            } else {
                setPgLocations([]);
                notification.showError(response.message || 'Failed to fetch PG locations');
            }
        } catch (error) {
            notification.showError("Failed to fetch PG locations", error instanceof Error ? error.message : "Contact support", 5000);
            setPgLocations([]);
        } finally {
            setPgLocationsLoading(false);
        }
    }, [memberData, notification]);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen && modelLayouts.approvalForm) {
            setFormData({
                roomNo: memberData?.roomNo || '',
                rentAmount: '',
                pricePerDay: '',
                advanceAmount: '',
                pgLocation: memberData?.pgLocation || '',
                dateOfJoining: '',
                dateOfRelieving: memberData?.rentType === 'SHORT_TERM' && memberData?.dateOfRelieving 
                    ? new Date(memberData.dateOfRelieving).toISOString().split('T')[0] 
                    : ''
            });
            setFormErrors({
                roomNo: '',
                rentAmount: '',
                pricePerDay: '',
                pgLocation: ''
            });
            // Clear data when modal opens
            setRoomData([]);
            setPgLocations([]);
            setSelectedPgId('');
            setRoomsLoading(false);
            setPgLocationsLoading(false);

            // Fetch PG locations when modal opens
            fetchPgLocations();
        }
    }, [isOpen, modelLayouts.approvalForm, memberData?.roomNo, memberData?.pgLocation, memberData?.dateOfRelieving, memberData?.rentType, fetchPgLocations]);

    // Function to fetch room data based on selected PG ID
    const fetchRoomData = useCallback(async (pgId: string) => {
        if (!pgId.trim()) {
            setRoomData([]);
            return;
        }

        setRoomsLoading(true);
        try {
            const response = await ApiClient.get(`/filters/pg/rooms?pgId=${pgId}`) as RoomApiResponse;

            if (response && response.success && response.data) {
                setRoomData(response.data.options);
            } else {
                setRoomData([]);
                notification.showError(response.message || 'Failed to fetch room data');
            }
        } catch (error) {
            notification.showError("Failed to fetch room data", error instanceof Error ? error.message : "Contact support", 5000);
            setRoomData([]);
        } finally {
            setRoomsLoading(false);
        }
    }, [notification]);

    // Auto-select PG location and fetch rooms when pgLocations are loaded
    useEffect(() => {
        if (isOpen && modelLayouts.approvalForm && memberData?.pgLocation && pgLocations.length > 0) {
            const selectedPgLocation = pgLocations.find(pg => pg.label === memberData.pgLocation || pg.pgName === memberData.pgLocation);
            
            if (selectedPgLocation && !selectedPgId) {
                setSelectedPgId(selectedPgLocation.value);
                fetchRoomData(selectedPgLocation.value);
            }
        }
    }, [isOpen, modelLayouts.approvalForm, memberData?.pgLocation, pgLocations, selectedPgId, fetchRoomData]);

    // Lock/unlock body scroll when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            // Store the original overflow style
            const originalStyle = window.getComputedStyle(document.body).overflow;

            // Lock the scroll
            document.body.style.overflow = 'hidden';

            // Cleanup function to restore scroll when modal closes
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isOpen]);

    // Form handling functions
    const handleFormChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (formErrors[field as keyof typeof formErrors]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }));
        }

        if (field === 'pgLocation') {
            // Find the selected PG location to get its ID
            const selectedPgLocation = pgLocations.find(pg => pg.value === value);

            setFormData(prev => ({
                ...prev,
                [field]: value,
                roomNo: '',
                rentAmount: ''
            }));

            // Set the selected PG ID and fetch room data
            if (selectedPgLocation) {
                setSelectedPgId(selectedPgLocation.value);
                fetchRoomData(selectedPgLocation.value);
            } else {
                setSelectedPgId('');
                setRoomData([]);
            }
        }

        // Special handling for room selection
        if (field === 'roomNo' && value) {
            const selectedRoom = roomData.find(room => room.value === value);
            if (selectedRoom) {
                // Just set the room number without auto-filling any price
                setFormData(prev => ({
                    ...prev,
                    roomNo: value
                }));
            }
        }
    };

    const validateForm = () => {
        const errors = { roomNo: '', rentAmount: '', pricePerDay: '', pgLocation: '' };
        let isValid = true;

        if (!formData.roomNo.trim()) {
            errors.roomNo = 'Room number is required';
            isValid = false;
        }

        // For long-term members, rentAmount is not required (auto-filled from room selection)
        // For short-term members, pricePerDay is required
        if (memberData?.rentType === 'SHORT_TERM') {
            if (!formData.pricePerDay.trim()) {
                errors.pricePerDay = 'Price per day is required';
                isValid = false;
            } else if (isNaN(Number(formData.pricePerDay)) || Number(formData.pricePerDay) <= 0) {
                errors.pricePerDay = 'Please enter a valid price per day';
                isValid = false;
            }
        }

        if (!formData.pgLocation.trim()) {
            errors.pgLocation = 'PG location is required';
            isValid = false;
        }

        if (formData.advanceAmount && (isNaN(Number(formData.advanceAmount)) || Number(formData.advanceAmount) < 0)) {
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleApproveUser = () => {
        if (validateForm() && onApproveUser && memberData?.id) {
            const approvalData: {
                roomId: string;
                rentAmount?: string;
                pricePerDay?: string;
                advanceAmount?: string;
                pgLocation: string;
                dateOfJoining?: string;
                dateOfRelieving?: string;
            } = {
                roomId: formData.roomNo,
                advanceAmount: formData.advanceAmount || undefined,
                pgLocation: formData.pgLocation,
                dateOfJoining: formData.dateOfJoining || undefined,
                dateOfRelieving: memberData?.rentType === 'SHORT_TERM' ? formData.dateOfRelieving || undefined : undefined
            };

            // Add the appropriate price field based on member type
            if (memberData.rentType === 'LONG_TERM') {
                approvalData.rentAmount = formData.rentAmount;
            } else {
                approvalData.pricePerDay = formData.pricePerDay;
            }

            onApproveUser(memberData.id.toString(), selectedPgId, approvalData);
            // Don't close modal here - parent will close it after successful API call
        }
    };

    const handleRejectUser = () => {
        if (onRejectUser && memberData?.id) {
            onRejectUser(memberData.id.toString());
            // Don't close modal here - parent will close it after successful API call
        }
    };

    if (!isOpen || !memberData) return null;

    const handleDocumentView = (imageUrl: string, documentName?: string) => {
        setDocumentViewer({
            isOpen: true,
            imageUrl,
            title: documentName || 'Document'
        });
    };

    const handleCloseDocumentViewer = () => {
        setDocumentViewer({
            isOpen: false,
            imageUrl: '',
            title: ''
        });
    };

    return (
        <div className="quick-view-modal-overlay" onClick={() => {
            // Prevent closing modal when loading
            if (!approveLoading && !rejectLoading) {
                onClose();
            }
        }}>
            <div className="quick-view-modal" onClick={(e) => e.stopPropagation()}>
                {/* Loading Overlay */}
                {(approveLoading || rejectLoading) && (
                    <div className="modal-loading-overlay">
                        <div className="loading-content">
                            <ui.Icons name="loader" size={24} className="animate-spin" />
                            <span className="loading-text">
                                {approveLoading ? 'Approving member...' : 'Rejecting member...'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Combined Header and Banner Layout */}
                <div className={`quick-view-header-banner header-banner--${memberData.rentType}`}>
                    {/* Header Section */}
                    <div className="header-content">
                        <div className="member-type-badge">
                            <span className="type-badge">
                                {memberData.rentType === 'LONG_TERM' ? 'Long-Term Member' : 'Short-Term Member'}
                            </span>
                        </div>
                        <button
                            className="close-button"
                            onClick={() => {
                                // Prevent closing modal when loading
                                if (!approveLoading && !rejectLoading) {
                                    onClose();
                                }
                            }}
                            disabled={approveLoading || rejectLoading}
                        >
                            <ui.Icons name="close" size={20} strokeWidth={2} />
                        </button>
                    </div>

                    {/* Banner Section */}
                    <div className="banner-content">
                        <div className="banner-profile">
                            <div 
                                className="profile-image profile-image--clickable"
                                onClick={() => memberData.profileImage && handleDocumentView(memberData.profileImage, 'Profile Image')}
                                title="Click to view profile image"
                            >
                                {memberData.profileImage ? (
                                    <>
                                        <ui.AuthenticatedImage
                                            src={memberData.profileImage}
                                            alt={memberData.name}
                                        />
                                        <div className="profile-image-overlay">
                                            <ui.Icons name="eye" size={24} strokeWidth={2} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="profile-placeholder">
                                        <ui.Icons name="user" size={32} strokeWidth={2} />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="banner-info">
                            <h2 className="member-name">{memberData.name}</h2>
                            <p className="member-id">ID: {memberData.memberId ? memberData.memberId : 'N/A'}</p>
                            <p className="member-room">Room: {memberData.roomNo ? memberData.roomNo : 'N/A'}</p>
                        </div>
                        {modelLayouts.showViewProfile && (
                            <div className="banner-actions">
                                <ui.Button
                                    variant="transparent"
                                    size="small"
                                    onClick={() => navigate(`/members/${memberData.id}`)}
                                    className="view-profile-btn"
                                >
                                    <ui.Icons name="user" size={16} />
                                </ui.Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Layout */}
                <div className={`quick-view-content content--${memberData.rentType}`}>
                    {/* Contact Info */}
                    <div className="info-section">
                        <h3 className={`section-title section-title--${memberData.rentType}`}>
                            <ui.Icons name="phone" size={16} />
                            Contact Information
                        </h3>
                        <div className="info-grid">
                            <div className={`info-item info-item--${memberData.rentType}`}>
                                <span className="info-label">Phone Number:</span>
                                <span className="info-value">{memberData.phone || 'Not provided'}</span>
                            </div>
                            <div className={`info-item info-item--${memberData.rentType}`}>
                                <span className="info-label">Email ID:</span>
                                <span className="info-value">{memberData.email || 'Not provided'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Info */}
                    {modelLayouts.paymentInfo && (
                        <div className="info-section">
                            <h3 className={`section-title section-title--${memberData.rentType}`}>
                                <ui.Icons name="creditCard" size={16} />
                                Payment Information
                            </h3>
                            <div className="info-grid">
                                <div className={`info-item info-item--${memberData.rentType}`}>
                                    <span className="info-label">Payment Status:</span>
                                    <span className={`status-badge status-badge--${memberData.paymentStatus.toLowerCase()}`}>
                                        {memberData.paymentStatus}
                                    </span>
                                </div>
                                <div className={`info-item info-item--${memberData.rentType}`}>
                                    <span className="info-label">Approval Status:</span>
                                    <span className={`approval-badge approval-badge--${memberData.paymentApprovalStatus?.toLowerCase() || 'pending'}`}>
                                        {memberData.paymentApprovalStatus || 'Pending'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Documents */}
                    <div className="info-section">
                        <h3 className={`section-title section-title--${memberData.rentType}`}>
                            <ui.Icons name="fileText" size={16} />
                            Documents
                        </h3>
                        <div className="documents-list">
                            {memberData.documents && memberData.documents.length > 0 ? (
                                memberData.documents.map((document, index) => (
                                    <div key={index} className={`document-item document-item--${memberData.rentType}`}>
                                        <span className="document-name">{document.name}</span>
                                        <ui.Button
                                            variant="transparent"
                                            size="small"
                                            onClick={() => handleDocumentView(document.url, document.name)}
                                            className="view-document-btn"
                                        >
                                            <ui.Icons name="eye" size={14} />
                                            View
                                        </ui.Button>
                                    </div>
                                ))
                            ) : (
                                <p className="no-documents">No documents available</p>
                            )}
                        </div>
                    </div>

                    {/* Approval Form */}
                    {modelLayouts.approvalForm && (
                        <div className="info-section">
                            <h3 className={`section-title section-title--${memberData.rentType}`}>
                                <ui.Icons name="edit" size={16} />
                                Approval Details
                            </h3>
                            <div className={`approval-form approval-form--${memberData.rentType}`}>
                                <div className="form-grid">

                                    <div className="form-group">
                                        <ui.Label htmlFor="pgLocation" required>PG Location</ui.Label>
                                        <ui.Select
                                            id="pgLocation"
                                            variant="custom"
                                            value={formData.pgLocation}
                                            searchable
                                            defaultValue={formData.pgLocation}
                                            onChange={(value) => handleFormChange('pgLocation', value)}
                                            placeholder={pgLocationsLoading ? "Loading PG locations..." : "Select PG location"}
                                            className={`form-input form-input--${memberData.rentType}`}
                                            disabled={pgLocationsLoading}
                                            options={[
                                                { value: '', label: pgLocationsLoading ? 'Loading PG locations...' : 'Select PG location' },
                                                ...pgLocations.map(pg => ({
                                                    value: pg.value,
                                                    label: `${pg.label} - ${pg.pgName}`
                                                }))
                                            ]}
                                        />
                                        {formErrors.pgLocation && (
                                            <span className="error-message">{formErrors.pgLocation}</span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <ui.Label htmlFor="roomNo" required>Room Number</ui.Label>
                                        <ui.Select
                                            id="roomNo"
                                            variant="custom"
                                            value={formData.roomNo}
                                            onChange={(value) => handleFormChange('roomNo', value)}
                                            placeholder={roomsLoading ? "Loading rooms..." : !formData.pgLocation ? "Select PG location first" : "Select room number"}
                                            className={`form-input form-input--${memberData.rentType}`}
                                            disabled={roomsLoading || !formData.pgLocation || roomData.length === 0}
                                            options={[
                                                { value: '', label: roomsLoading ? 'Loading rooms...' : !formData.pgLocation ? 'Select PG location first' : 'Select room number' },
                                                ...roomData.map(room => ({
                                                    value: room.value,
                                                    label: `Room ${room.label} - ${room.currentOccupancy}/${room.capacity} occupied`
                                                }))
                                            ]}
                                        />
                                        {formErrors.roomNo && (
                                            <span className="error-message">{formErrors.roomNo}</span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <ui.Label htmlFor="rentAmount" required>
                                            {memberData.rentType === 'SHORT_TERM' ? 'Rent Amount per Day' : 'Rent Amount'}
                                        </ui.Label>
                                        <ui.Input
                                            id="rentAmount"
                                            type="number"
                                            value={memberData.rentType === 'SHORT_TERM' ? formData.pricePerDay : formData.rentAmount}
                                            onChange={(e) => handleFormChange(memberData.rentType === 'SHORT_TERM' ? 'pricePerDay' : 'rentAmount', e.target.value)}
                                            placeholder={memberData.rentType === 'SHORT_TERM' ? 'Enter daily rent amount' : 'Enter rent amount'}
                                            error={memberData.rentType === 'SHORT_TERM' ? formErrors.pricePerDay : formErrors.rentAmount}
                                            className={`form-input form-input--${memberData.rentType}`}
                                        />
                                        {memberData.rentType === 'SHORT_TERM' && (
                                            <small className="rent-info-note">
                                                Enter the daily rent amount for this short-term stay
                                            </small>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <ui.Label htmlFor="advanceAmount">Advance Amount</ui.Label>
                                        <ui.Input
                                            id="advanceAmount"
                                            type="number"
                                            value={formData.advanceAmount}
                                            onChange={(e) => handleFormChange('advanceAmount', e.target.value)}
                                            placeholder="Enter advance amount (optional)"
                                            className={`form-input form-input--${memberData.rentType}`}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <ui.Label htmlFor="dateOfJoining">Date Of Joining</ui.Label>
                                        <ui.DateInput
                                            id="dateOfJoining"
                                            value={formData.dateOfJoining}
                                            onChange={(value) => handleFormChange('dateOfJoining', value)}
                                            className={`form-input form-input--${memberData.rentType}`}
                                        />
                                    </div>

                                    {memberData.rentType === 'SHORT_TERM' && (
                                        <div className="form-group">
                                            <ui.Label htmlFor="dateOfRelieving">Date Of Relieving</ui.Label>
                                            <ui.DateInput
                                                id="dateOfRelieving"
                                                value={formData.dateOfRelieving}
                                                onChange={(value) => handleFormChange('dateOfRelieving', value)}
                                                className={`form-input form-input--${memberData.rentType}`}
                                                min={formData.dateOfJoining || undefined}
                                            />
                                            <small className="date-info-note">
                                                Select the expected checkout date for this short-term stay
                                            </small>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Layout - Actions */}
                <div className="quick-view-footer">
                    <div className="footer-actions">
                        {modelLayouts.approvalForm && (
                            <div className="approve-user-actions">
                                <ui.Button
                                    variant="danger"
                                    size="medium"
                                    onClick={handleRejectUser}
                                    disabled={rejectLoading || approveLoading}
                                    className="approve-user-btn"
                                    leftIcon={<ui.Icons name={rejectLoading ? "loader" : "close"} size={16} className={rejectLoading ? "animate-spin" : ""} />}
                                >
                                    {rejectLoading ? "Rejecting..." : "Reject"}
                                </ui.Button>
                                <ui.Button
                                    variant="success"
                                    size="medium"
                                    onClick={handleApproveUser}
                                    disabled={approveLoading || rejectLoading}
                                    className="approve-user-btn"
                                    leftIcon={<ui.Icons name={approveLoading ? "loader" : "check"} size={16} className={approveLoading ? "animate-spin" : ""} />}
                                >
                                    {approveLoading ? "Approving..." : "Approve User"}
                                </ui.Button>
                            </div>

                        )}
                    </div>
                </div>
            </div>

            {/* Document Viewer Modal */}
            <ui.DocumentViewer
                isOpen={documentViewer.isOpen}
                imageUrl={documentViewer.imageUrl}
                title={documentViewer.title}
                onClose={handleCloseDocumentViewer}
            />
        </div>
    );
};

export default QuickViewModal;
