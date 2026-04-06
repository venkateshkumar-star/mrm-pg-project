import React, { useState, useEffect } from "react";
import ui from "@/components/ui";
import type { types } from "@/types";
import type { RoomData } from '@/types/apiResponseTypes';
import "./RoomModal.scss";

interface RoomModalProps {
    isOpen: boolean;
    isEdit: boolean;
    roomData: RoomData | null;
    pgDetails: {
        id: string;
        name: string;
        type: string;
        location: string;
    } | null;
    filterItems: types["FilterItemProps"][];
    onClose: () => void;
    onSave: (roomData: {
        roomNo: string;
        capacity: number;
        rent?: number;
        pgLocation: string;
        electricityCharge?: number;
    }) => Promise<void>;
    onDelete: (roomId: string) => Promise<void>;
    loading?: boolean;
}

const RoomModal: React.FC<RoomModalProps> = ({
    isOpen,
    isEdit,
    roomData,
    pgDetails,
    filterItems,
    onClose,
    onSave,
    onDelete,
    loading = false
}) => {
    const [formData, setFormData] = useState({
        roomNo: '',
        capacity: '',
        pgLocation: '',
    });

    const [formErrors, setFormErrors] = useState({
        roomNo: '',
        capacity: '',
        pgLocation: '',
    });

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

    // Initialize form data
    useEffect(() => {
        if (isOpen) {
            if (isEdit && roomData) {
                setFormData({
                    roomNo: roomData.roomNo,
                    capacity: roomData.capacity.toString(),
                    pgLocation: (roomData as Record<string, unknown>).pgLocation as string || '',
                });
            } else {
                setFormData({
                    roomNo: '',
                    capacity: '',
                    pgLocation: '',
                });
            }
            setFormErrors({ roomNo: '', capacity: '', pgLocation: '' });
            setShowDeleteConfirmation(false);
            setDeleteConfirmationText('');
        }
    }, [isOpen, isEdit, roomData]);

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

    const handleInputChange = (field: string, value: string | string[]) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear error when user starts typing
        if (formErrors[field as keyof typeof formErrors]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const errors = { roomNo: '', capacity: '', rent: '', pgLocation: '', electricityCharge: '' };
        let isValid = true;

        // Room number validation
        if (!formData.roomNo.trim()) {
            errors.roomNo = 'Room number is required';
            isValid = false;
        } else if (formData.roomNo.trim().length < 1) {
            errors.roomNo = 'Room number must be at least 1 character';
            isValid = false;
        }

        // Capacity validation
        if (!formData.capacity.trim()) {
            errors.capacity = 'Capacity is required';
            isValid = false;
        } else if (isNaN(Number(formData.capacity))) {
            errors.capacity = 'Capacity must be a number';
            isValid = false;
        } else {
            const capacity = Number(formData.capacity);
            if (capacity < 1) {
                errors.capacity = 'Capacity must be at least 1';
                isValid = false;
            } else if (capacity > 20) {
                errors.capacity = 'Capacity cannot exceed 20 members';
                isValid = false;
            }
        }

        // PG Location validation (only for new rooms)
        if (!isEdit && !formData.pgLocation.trim()) {
            errors.pgLocation = 'PG location is required';
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleSave = async () => {
        if (validateForm()) {
            if (isEdit) {
                const roomDataToSave = {
                    roomNo: formData.roomNo,
                    capacity: Number(formData.capacity)
                } as {
                    roomNo: string;
                    capacity: number;
                    pgLocation: string;
                };
                await onSave(roomDataToSave);
            } else {
                const roomDataToSave: {
                    roomNo: string;
                    capacity: number;
                    pgLocation: string;
                    rent?: number;
                    electricityCharge?: number;
                } = {
                    roomNo: formData.roomNo,
                    capacity: Number(formData.capacity),
                    pgLocation: formData.pgLocation
                };
                await onSave(roomDataToSave);
            }
        }
    };

    const handleDelete = async () => {
        if (roomData && roomData.id && deleteConfirmationText === roomData.roomNo) {
            setDeleteLoading(true);
            try {
                await onDelete(roomData.id);
            } catch (error) {
                console.error('Delete operation failed:', error);
            } finally {
                setDeleteLoading(false);
                setShowDeleteConfirmation(false);
                setDeleteConfirmationText('');
            }
        }
    };

    const handleDeleteConfirmationChange = (value: string) => {
        setDeleteConfirmationText(value);
    };

    const isDeleteConfirmed = deleteConfirmationText === roomData?.roomNo;

    // Get PG location options from filters
    const pgLocationOptions = filterItems.length > 1 ? filterItems[1].options || [] : [];

    if (!isOpen) return null;

    const isDeleteDisabled = (roomData?.currentOccupancy ?? 0) > 0;

    return (
        <div className="modal-overlay" onClick={() => !loading && !deleteLoading && onClose()}>
            <div className="room-modal" onClick={(e) => e.stopPropagation()}>
                {/* Loading Overlay */}
                {(loading || deleteLoading) && (
                    <div className="modal-loading-overlay">
                        <div className="loading-content">
                            <ui.Icons name="loader" size={24} className="animate-spin" />
                            <span className="loading-text">
                                {deleteLoading ? 'Deleting room...' : (isEdit ? 'Updating room...' : 'Creating room...')}
                            </span>
                        </div>  
                    </div>
                )}

                <div className="modal-header">
                    <div className="header-content">
                        <ui.Icons name={isEdit ? "edit" : "plus"} size={24} className="action-icon" />
                        <div className="header-text">
                            <h3>{isEdit ? `Edit Room ${roomData?.roomNo}` : 'Add New Room'}</h3>
                            <p>{isEdit ? 'Update room information or manage room settings' : 'Create a new room in the PG'}</p>
                        </div>
                    </div>
                    <button 
                        className="close-button"
                        onClick={() => !loading && !deleteLoading && onClose()}
                        disabled={loading || deleteLoading}
                    >
                        <ui.Icons name="close" size={20} />
                    </button>
                </div>

                <div className="modal-content">
                    {isEdit && roomData && (
                        <div className="room-status-section">
                            {/* PG Information Section */}
                            {pgDetails && (
                                <div className="info-section pg-info-section">
                                    <div className="section-header">
                                        <ui.Icons name="building" size={18} />
                                        <h4>PG Information</h4>
                                    </div>
                                    <div className="section-content">
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <span className="label">PG Name</span>
                                                <span className="value">{pgDetails.name}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="label">Location</span>
                                                <span className="value">{pgDetails.location}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="label">Type</span>
                                                <span className="value type-badge">{pgDetails.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Room Status Section */}
                            <div className="info-section room-status">
                                <div className="section-header">
                                    <ui.Icons name="home" size={18} />
                                    <h4>Current Room Status</h4>
                                </div>
                                <div className="section-content">
                                    <div className="status-grid">
                                        <div className="status-card">
                                            <div className="status-icon">
                                                <ui.Icons name="users" size={16} />
                                            </div>
                                            <div className="status-info">
                                                <span className="status-label">Occupancy</span>
                                                <span className="status-value">
                                                    {roomData.currentOccupancy}/{roomData.capacity}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="status-card">
                                            <div className="status-icon">
                                                <ui.Icons name="userCheck" size={16} />
                                            </div>
                                            <div className="status-info">
                                                <span className="status-label">Available</span>
                                                <span className="status-value available">
                                                    {roomData.availableSlots}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="status-card">
                                            <div className="status-icon">
                                                <ui.Icons name="checkCircle2" size={16} />
                                            </div>
                                            <div className="status-info">
                                                <span className="status-label">Status</span>
                                                <span className={`status-badge status-badge--${roomData.statusValue.replace('_', '-')}`}>
                                                    {roomData.statusValue.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="status-card">
                                            <div className="status-icon">
                                                <ui.Icons name="checkCircle2" size={16} />
                                            </div>
                                            <div className="status-info">
                                                <span className="status-label">Fully Occupied</span>
                                                <span className={`status-value ${roomData.isFullyOccupied ? 'occupied' : 'available'}`}>
                                                    {roomData.isFullyOccupied ? 'Yes' : 'No'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {roomData.members && roomData.members.length > 0 && (
                                        <div className="members-section">
                                            <div className="members-header">
                                                <ui.Icons name="users" size={16} />
                                                <span>Current Members ({roomData.members.length})</span>
                                            </div>
                                            <div className="members-grid">
                                                {roomData.members.map((member) => (
                                                    <div key={member.id} className="member-card">
                                                        <div className="member-info">
                                                            <span className="member-name">{member.name}</span>
                                                            <span className="member-id">#{member.memberId}</span>
                                                        </div>
                                                        <span className={`rent-type-badge rent-type--${member.rentType.toLowerCase().replace('_', '-')}`}>
                                                            {member.rentType.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="form-section">
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <ui.Label htmlFor="pgLocation" required>PG Location</ui.Label>
                                {isEdit ? (
                                    <div className="readonly-field">
                                        <div className="readonly-content">
                                            <ui.Icons name="home" size={16} />
                                            <span className="readonly-value">
                                                {pgDetails ? `${pgDetails.name} - ${pgDetails.location}` : (formData.pgLocation || 'N/A')}
                                            </span>
                                        </div>
                                        <span className="readonly-note">PG location cannot be changed when editing a room</span>
                                    </div>
                                ) : (
                                    <>
                                        <ui.Select
                                            id="pgLocation"
                                            variant="custom"
                                            value={formData.pgLocation}
                                            onChange={(value) => handleInputChange('pgLocation', value)}
                                            placeholder="Select PG location"
                                            disabled={loading}
                                            options={[
                                                { value: '', label: 'Select PG location' },
                                                ...pgLocationOptions.map(option => ({
                                                    value: option.value,
                                                    label: option.label
                                                }))
                                            ]}
                                        />
                                        {formErrors.pgLocation && (
                                            <span className="error-message">
                                                {formErrors.pgLocation}
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="form-group">
                                <ui.Label htmlFor="roomNo" required>Room Number</ui.Label>
                                <div className="input-with-icon">
                                    <ui.Icons name="fileText" size={16} className="input-icon" />
                                    <ui.Input
                                        id="roomNo"
                                        type="text"
                                        value={formData.roomNo}
                                        onChange={(e) => handleInputChange('roomNo', e.target.value)}
                                        placeholder="e.g., 101, A-201"
                                        error={formErrors.roomNo}
                                        disabled={isEdit || loading}
                                        className="input-with-padding"
                                    />
                                </div>
                                {isEdit && (
                                    <span className="field-note">Room number cannot be changed</span>
                                )}
                            </div>

                            <div className="form-group">
                                <ui.Label htmlFor="capacity" required>Room Capacity</ui.Label>
                                <div className="input-with-icon">
                                    <ui.Icons name="users" size={16} className="input-icon" />
                                    <ui.Input
                                        id="capacity"
                                        type="number"
                                        value={formData.capacity}
                                        onChange={(e) => handleInputChange('capacity', e.target.value)}
                                        placeholder="Enter capacity"
                                        error={formErrors.capacity}
                                        min="1"
                                        max="20"
                                        disabled={loading}
                                        className="input-with-padding"
                                    />
                                </div>
                                <span className="field-note">Maximum 20 members per room</span>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone Section - Only show in edit mode */}
                    {isEdit && roomData && (
                        <div className="danger-zone-section">
                            <div className="section-header">
                                <ui.Icons name="alertTriangle" size={18} className="danger-icon" />
                                <h4>Danger Zone</h4>
                            </div>
                            <div className="section-content">
                                <div className="danger-warning">
                                    <div className="warning-content">
                                        <div className="warning-text">
                                            <h5>Delete Room</h5>
                                            <p>Permanently delete this room and all its data. This action cannot be undone.</p>
                                            {isDeleteDisabled && (
                                                <div className="blocking-warning">
                                                    <ui.Icons name="alertCircle" size={16} />
                                                    <span>Room has {roomData.currentOccupancy} member(s). Remove all members before deletion.</span>
                                                </div>
                                            )}
                                        </div>
                                        {!showDeleteConfirmation ? (
                                            <ui.Button
                                                variant="danger"
                                                size="small"
                                                onClick={() => setShowDeleteConfirmation(true)}
                                                disabled={isDeleteDisabled || loading || deleteLoading}
                                                className="danger-button"
                                            >
                                                Delete Room
                                            </ui.Button>
                                        ) : (
                                            <div className="delete-confirmation">
                                                <div className="confirmation-prompt">
                                                    <p className="confirmation-text">
                                                        To confirm deletion, type <strong>{roomData.roomNo}</strong> in the field below:
                                                    </p>
                                                    <div className="confirmation-input">
                                                        <ui.Input
                                                            type="text"
                                                            value={deleteConfirmationText}
                                                            onChange={(e) => handleDeleteConfirmationChange(e.target.value)}
                                                            placeholder={`Type "${roomData.roomNo}" to confirm`}
                                                            disabled={deleteLoading}
                                                            className="delete-confirmation-field"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="confirmation-actions">
                                                    <ui.Button
                                                        variant="secondary"
                                                        size="small"
                                                        onClick={() => {
                                                            setShowDeleteConfirmation(false);
                                                            setDeleteConfirmationText('');
                                                        }}
                                                        disabled={deleteLoading}
                                                    >
                                                        Cancel
                                                    </ui.Button>
                                                    <ui.Button
                                                        variant="danger"
                                                        size="small"
                                                        onClick={handleDelete}
                                                        disabled={!isDeleteConfirmed || deleteLoading}
                                                        loading={deleteLoading}
                                                    >
                                                        {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
                                                    </ui.Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-actions">
                    <ui.Button
                        variant="secondary"
                        size="medium"
                        onClick={onClose}
                        disabled={loading || deleteLoading}
                        className="cancel-button"
                    >
                        Cancel
                    </ui.Button>
                    <ui.Button
                        variant="primary"
                        size="medium"
                        onClick={handleSave}
                        disabled={loading || deleteLoading}
                        loading={loading}
                        className="save-button"
                        leftIcon={<ui.Icons name={isEdit ? "save" : "plus"} size={16} />}
                    >
                        {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Room' : 'Create Room')}
                    </ui.Button>
                </div>
            </div>
        </div>
    );
};

export default RoomModal;
