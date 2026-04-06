import React, { useState, useEffect, useCallback } from "react";
import ui from "@/components/ui";
import "./EBModal.scss";
import { ApiClient } from "@/utils";
import { useNotification } from "@/hooks/useNotification";

interface PGLocationOption {
    value: string;
    label: string;
    pgName: string;
    pgType: string;
}

interface RoomOption {
    value: string;
    label: string;
    capacity: number;
    currentOccupancy: number;
    rent: number;
    isAvailable: boolean;
}

interface PGInfo {
    id: string;
    name: string;
    location: string;
    type: string;
}

interface EBModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (ebData: {
        roomId: string;
        amount: number;
        month: number;
        year: number;
        billDate: string;
        unitsUsed: number;
        description: string;
    }) => Promise<void>;
    loading?: boolean;
}

const EBModal: React.FC<EBModalProps> = ({
    isOpen,
    onClose,
    onSave,
    loading = false
}) => {
    const notification = useNotification();
    
    const [formData, setFormData] = useState({
        pgLocation: '',
        roomId: '',
        amount: '',
        month: new Date().getMonth() + 1, // Current month
        year: new Date().getFullYear(), // Current year
        billDate: new Date().toISOString().split('T')[0], // Today's date
        unitsUsed: '',
        description: ''
    });

    const [formErrors, setFormErrors] = useState({
        pgLocation: '',
        roomId: '',
        amount: '',
        unitsUsed: '',
        description: ''
    });

    const [pgLocations, setPgLocations] = useState<PGLocationOption[]>([]);
    const [rooms, setRooms] = useState<RoomOption[]>([]);
    const [pgInfo, setPgInfo] = useState<PGInfo | null>(null);
    const [locationsLoading, setLocationsLoading] = useState(false);
    const [roomsLoading, setRoomsLoading] = useState(false);

    // Fetch PG locations
    const fetchPGLocations = useCallback(async () => {
        setLocationsLoading(true);
        try {
            const response = await ApiClient.get('/filters/admin-pg-locations') as {
                success: boolean;
                data: {
                    options: PGLocationOption[];
                    adminPgType: string;
                };
                message?: string;
                error?: string;
            };

            if (response.success && response.data) {
                setPgLocations(response.data.options || []);
            } else {
                notification.showError(response.error || "Failed to fetch PG locations", response.message, 5000);
                setPgLocations([]);
            }
        } catch (err) {
            notification.showError("Failed to fetch PG locations", err instanceof Error ? err.message : "Check your internet connection and try again.", 5000);
            setPgLocations([]);
        } finally {
            setLocationsLoading(false);
        }
    }, [notification]);

    // Fetch rooms based on selected PG
    const fetchRooms = useCallback(async (pgId: string) => {
        if (!pgId) return;
        
        setRoomsLoading(true);
        try {
            const response = await ApiClient.get(`/filters/pg/rooms?pgId=${pgId}`) as {
                success: boolean;
                data: {
                    options: RoomOption[];
                    pgInfo: PGInfo;
                };
                message?: string;
                error?: string;
            };

            if (response.success && response.data) {
                setRooms(response.data.options || []);
                setPgInfo(response.data.pgInfo || null);
            } else {
                notification.showError(response.error || "Failed to fetch rooms", response.message, 5000);
                setRooms([]);
                setPgInfo(null);
            }
        } catch (err) {
            notification.showError("Failed to fetch rooms", err instanceof Error ? err.message : "Check your internet connection and try again.", 5000);
            setRooms([]);
            setPgInfo(null);
        } finally {
            setRoomsLoading(false);
        }
    }, [notification]);

    // Load PG locations when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchPGLocations();
        }
    }, [isOpen, fetchPGLocations]);

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

    // Handle PG location change
    const handlePGLocationChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            pgLocation: value,
            roomId: '' // Reset room selection
        }));
        setRooms([]); // Clear rooms
        setPgInfo(null); // Clear PG info
        
        if (value) {
            fetchRooms(value);
        }
    };

    // Handle form field changes
    const handleInputChange = (field: string, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user starts typing
        if (formErrors[field as keyof typeof formErrors]) {
            setFormErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const errors = {
            pgLocation: '',
            roomId: '',
            amount: '',
            unitsUsed: '',
            description: ''
        };

        if (!formData.pgLocation) {
            errors.pgLocation = 'PG Location is required';
        }

        if (!formData.roomId) {
            errors.roomId = 'Room selection is required';
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            errors.amount = 'Valid amount is required';
        }

        if (!formData.unitsUsed || parseInt(formData.unitsUsed) <= 0) {
            errors.unitsUsed = 'Valid units used is required';
        }

        // Description is optional, no validation needed

        setFormErrors(errors);
        return Object.values(errors).every(error => !error);
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            await onSave({
                roomId: formData.roomId,
                amount: parseFloat(formData.amount),
                month: formData.month,
                year: formData.year,
                billDate: new Date(formData.billDate).toISOString(),
                unitsUsed: parseInt(formData.unitsUsed),
                description: formData.description
            });
            handleClose();
        } catch (error) {
            console.error('Error saving EB data:', error);
        }
    };

    // Reset form and close modal
    const handleClose = () => {
        setFormData({
            pgLocation: '',
            roomId: '',
            amount: '',
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            billDate: new Date().toISOString().split('T')[0],
            unitsUsed: '',
            description: ''
        });
        setFormErrors({
            pgLocation: '',
            roomId: '',
            amount: '',
            unitsUsed: '',
            description: ''
        });
        setRooms([]);
        setPgInfo(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="eb-modal-overlay">
            <div className="eb-modal">
                <div className="eb-modal__header">
                    <h2>Add Electricity Bill</h2>
                    <ui.Button
                        variant="transparent"
                        size="small"
                        onClick={handleClose}
                        className="close-btn"
                    >
                        <ui.Icons name="close" size={20} />
                    </ui.Button>
                </div>

                <div className="eb-modal__content">
                    <form className="eb-form">
                        {/* PG Location Selection */}
                        <div className="form-group">
                            <ui.Label htmlFor="pgLocation" required>
                                PG Location
                            </ui.Label>
                            <ui.Select
                                id="pgLocation"
                                value={formData.pgLocation}
                                onChange={(value) => handlePGLocationChange(value as string)}
                                placeholder="Select PG Location"
                                disabled={locationsLoading}
                                options={pgLocations.map(location => ({
                                    value: location.value,
                                    label: `${location.label} - ${location.pgName}`
                                }))}
                            />
                            {formErrors.pgLocation && (
                                <span className="error-text">{formErrors.pgLocation}</span>
                            )}
                        </div>

                        {/* Room Selection */}
                        <div className="form-group">
                            <ui.Label htmlFor="roomId" required>
                                Room
                            </ui.Label>
                            <ui.Select
                                id="roomId"
                                value={formData.roomId}
                                onChange={(value) => handleInputChange('roomId', value as string)}
                                placeholder={formData.pgLocation ? "Select Room" : "Select PG Location first"}
                                disabled={!formData.pgLocation || roomsLoading}
                                options={rooms.map(room => ({
                                    value: room.value,
                                    label: `${room.label} (${room.currentOccupancy}/${room.capacity})`
                                }))}
                            />
                            {formErrors.roomId && (
                                <span className="error-text">{formErrors.roomId}</span>
                            )}
                        </div>

                        {/* Month and Year */}
                        <div className="form-row">
                            <div className="form-group">
                                <ui.Label htmlFor="month" required>
                                    Month
                                </ui.Label>
                                <ui.Select
                                    id="month"
                                    value={formData.month.toString()}
                                    onChange={(value) => handleInputChange('month', parseInt(value as string))}
                                    options={[
                                        { value: '1', label: 'January' },
                                        { value: '2', label: 'February' },
                                        { value: '3', label: 'March' },
                                        { value: '4', label: 'April' },
                                        { value: '5', label: 'May' },
                                        { value: '6', label: 'June' },
                                        { value: '7', label: 'July' },
                                        { value: '8', label: 'August' },
                                        { value: '9', label: 'September' },
                                        { value: '10', label: 'October' },
                                        { value: '11', label: 'November' },
                                        { value: '12', label: 'December' }
                                    ]}
                                />
                            </div>
                            <div className="form-group">
                                <ui.Label htmlFor="year" required>
                                    Year
                                </ui.Label>
                                <ui.NumberInput
                                    id="year"
                                    value={formData.year}
                                    onChange={(value) => handleInputChange('year', value)}
                                    min={2020}
                                    max={2030}
                                />
                            </div>
                        </div>

                        {/* Bill Date */}
                        <div className="form-group">
                            <ui.Label htmlFor="billDate" required>
                                Bill Date
                            </ui.Label>
                            <ui.DateInput
                                id="billDate"
                                value={formData.billDate}
                                onChange={(value) => handleInputChange('billDate', value)}
                            />
                        </div>

                        {/* Units Used and Amount */}
                        <div className="form-row">
                            <div className="form-group">
                                <ui.Label htmlFor="unitsUsed" required>
                                    Units Used
                                </ui.Label>
                                <ui.NumberInput
                                    id="unitsUsed"
                                    value={parseInt(formData.unitsUsed) || 0}
                                    onChange={(value) => handleInputChange('unitsUsed', value.toString())}
                                    placeholder="Enter units used"
                                    min={0}
                                />
                                {formErrors.unitsUsed && (
                                    <span className="error-text">{formErrors.unitsUsed}</span>
                                )}
                            </div>
                            <div className="form-group">
                                <ui.Label htmlFor="amount" required>
                                    Total Amount (₹)
                                </ui.Label>
                                <ui.NumberInput
                                    id="amount"
                                    value={parseFloat(formData.amount) || 0}
                                    onChange={(value) => handleInputChange('amount', value.toString())}
                                    placeholder="Enter total amount"
                                    min={0}
                                    step={0.01}
                                />
                                {formErrors.amount && (
                                    <span className="error-text">{formErrors.amount}</span>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="form-group">
                            <ui.Label htmlFor="description">
                                Description
                            </ui.Label>
                            <textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Enter bill description (optional)"
                                rows={3}
                                className="form-textarea"
                            />
                            {formErrors.description && (
                                <span className="error-text">{formErrors.description}</span>
                            )}
                        </div>

                        {/* PG Info Display */}
                        {pgInfo && (
                            <div className="pg-info">
                                <h4>Selected PG Information</h4>
                                <p><strong>Name:</strong> {pgInfo.name}</p>
                                <p><strong>Location:</strong> {pgInfo.location}</p>
                                <p><strong>Type:</strong> {pgInfo.type}</p>
                            </div>
                        )}
                    </form>
                </div>

                <div className="eb-modal__footer">
                    <ui.Button
                        variant="secondary"
                        size="medium"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancel
                    </ui.Button>
                    <ui.Button
                        variant="primary"
                        size="medium"
                        onClick={handleSubmit}
                        loading={loading}
                        disabled={loading}
                    >
                        Add EB Bill
                    </ui.Button>
                </div>
            </div>
        </div>
    );
};

export { EBModal };