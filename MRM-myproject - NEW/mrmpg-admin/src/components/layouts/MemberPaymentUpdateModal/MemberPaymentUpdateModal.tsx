import React, { useState, useCallback } from "react";
import ui from "@/components/ui";
import { ApiClient } from "@/utils";
import { useNotification } from "@/hooks/useNotification";
import "./MemberPaymentUpdateModal.scss";

// Types
interface PaymentUpdateData {
    id: string;
    memberName: string;
    amount: number;
    month: number;
    year: number;
    currentStatus: string;
    dueDate: string;
}

interface MemberPaymentUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentData: PaymentUpdateData | null;
    onPaymentUpdated?: () => void;
}

interface FormData {
    paymentMethod: 'CASH' | 'ONLINE';
    paidDate: string;
    rentBillScreenshot?: File | null;
    electricityBillScreenshot?: File | null;
}

interface ApiResponse {
    success: boolean;
    message: string;
    data?: {
        payment: Record<string, unknown>;
        memberInfo: {
            memberId: string;
            memberName: string;
            memberEmail: string;
        };
        approvalDetails: {
            approvedBy: string;
            approvedAt: string;
            paymentMethod: string;
            hasProofDocuments: boolean;
        };
    };
    error?: string;
}

const MemberPaymentUpdateModal: React.FC<MemberPaymentUpdateModalProps> = ({
    isOpen,
    onClose,
    paymentData,
    onPaymentUpdated
}) => {
    const notification = useNotification();
    
    // Form state
    const [formData, setFormData] = useState<FormData>({
        paymentMethod: 'CASH',
        paidDate: new Date().toISOString().split('T')[0],
        rentBillScreenshot: null,
        electricityBillScreenshot: null
    });

    // Loading state
    const [submitting, setSubmitting] = useState(false);

    // Form validation errors
    const [errors, setErrors] = useState<{
        paymentMethod?: string;
        paidDate?: string;
    }>({});

    // Reset form when modal opens/closes
    React.useEffect(() => {
        if (isOpen) {
            setFormData({
                paymentMethod: 'CASH',
                paidDate: new Date().toISOString().split('T')[0],
                rentBillScreenshot: null,
                electricityBillScreenshot: null
            });
            setErrors({});
        }
    }, [isOpen]);

    // Lock body scroll when modal is open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [isOpen]);

    // Get month name helper
    const getMonthName = (month: number) => {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[month - 1] || 'Unknown';
    };

    // Format currency helper
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Handle form field changes
    const handleFieldChange = (field: keyof FormData, value: string | File | null) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        // Clear error when user starts typing
        if (errors[field as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    // Validate form
    const validateForm = useCallback((): boolean => {
        const newErrors: typeof errors = {};

        if (!formData.paymentMethod) {
            newErrors.paymentMethod = 'Payment method is required';
        }

        if (!formData.paidDate) {
            newErrors.paidDate = 'Paid date is required';
        } else {
            const selectedDate = new Date(formData.paidDate);
            const today = new Date();
            today.setHours(23, 59, 59, 999); // Set to end of today
            
            if (selectedDate > today) {
                newErrors.paidDate = 'Paid date cannot be in the future';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    // Handle form submission
    const handleSubmit = useCallback(async () => {
        if (!paymentData || !validateForm()) return;

        setSubmitting(true);
        try {
            let apiResponse: ApiResponse;

            if (formData.paymentMethod === 'CASH') {
                // For cash payments, send JSON
                const requestBody = {
                    paymentMethod: formData.paymentMethod,
                    paidDate: formData.paidDate
                };

                apiResponse = await ApiClient.put(
                    `/admin/payments/${paymentData.id}/mark-paid`,
                    requestBody
                ) as ApiResponse;
            } else {
                // For online payments, send FormData
                const formDataToSend = new FormData();
                formDataToSend.append('paymentMethod', formData.paymentMethod);
                formDataToSend.append('paidDate', formData.paidDate);
                
                if (formData.rentBillScreenshot) {
                    formDataToSend.append('rentBillScreenshot', formData.rentBillScreenshot);
                }
                
                if (formData.electricityBillScreenshot) {
                    formDataToSend.append('electricityBillScreenshot', formData.electricityBillScreenshot);
                }

                apiResponse = await ApiClient.putFormData(
                    `/admin/payments/${paymentData.id}/mark-paid`,
                    formDataToSend
                ) as ApiResponse;
            }

            if (apiResponse.success) {
                notification.showSuccess(
                    'Payment Updated Successfully',
                    `Payment has been marked as paid via ${formData.paymentMethod.toLowerCase()} for ${paymentData.memberName}`,
                    4000
                );
                
                // Close modal and trigger refresh
                onClose();
                onPaymentUpdated?.();
            } else {
                notification.showError(
                    'Payment Update Failed',
                    apiResponse.message || apiResponse.error || 'Unknown error occurred',
                    5000
                );
            }
        } catch (error) {
            notification.showError(
                'Payment Update Failed',
                error instanceof Error ? error.message : 'Network error occurred',
                5000
            );
        } finally {
            setSubmitting(false);
        }
    }, [paymentData, formData, validateForm, notification, onClose, onPaymentUpdated]);

    if (!isOpen || !paymentData) return null;

    return (
        <div className="member-payment-update-modal-overlay" onClick={onClose}>
            <div className="member-payment-update-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="header-content">
                        <h2>Update Payment Status</h2>
                        <p>Manually mark payment as paid for member</p>
                    </div>
                    <ui.Button
                        variant="ghost"
                        size="small"
                        onClick={onClose}
                        disabled={submitting}
                        className="close-button"
                    >
                        <ui.Icons name="close" size={20} />
                    </ui.Button>
                </div>

                {/* Payment Info Summary */}
                <div className="payment-summary">
                    <div className="summary-header">
                        <ui.Icons name="creditCard" size={20} />
                        <h3>Payment Information</h3>
                    </div>
                    <div className="summary-content">
                        <div className="summary-grid">
                            <div className="summary-item">
                                <label>Member Name</label>
                                <span>{paymentData.memberName}</span>
                            </div>
                            <div className="summary-item">
                                <label>Amount</label>
                                <span className="amount-value">{formatCurrency(paymentData.amount)}</span>
                            </div>
                            <div className="summary-item">
                                <label>Period</label>
                                <span>{getMonthName(paymentData.month)} {paymentData.year}</span>
                            </div>
                            <div className="summary-item">
                                <label>Current Status</label>
                                <span className={`status-badge status-badge--${paymentData.currentStatus.toLowerCase()}`}>
                                    {paymentData.currentStatus}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="modal-form">
                    <div className="form-section">
                        <h4>Payment Method</h4>
                        
                        {/* Payment Method */}
                        <div className="form-group">
                            <ui.Radio
                                id="paymentMethod"
                                value={formData.paymentMethod}
                                onChange={(value) => handleFieldChange('paymentMethod', value)}
                                options={[
                                    { value: 'CASH', label: 'Cash Payment' },
                                    { value: 'ONLINE', label: 'Online Payment' }
                                ]}
                            />
                            {errors.paymentMethod && (
                                <span className="error-message">{errors.paymentMethod}</span>
                            )}
                        </div>

                        {/* Paid Date */}
                        <div className="form-group">
                            <ui.Label htmlFor="paidDate" required>Paid Date</ui.Label>
                            <ui.DateInput
                                id="paidDate"
                                value={formData.paidDate}
                                onChange={(value) => handleFieldChange('paidDate', value)}
                                max={new Date().toISOString().split('T')[0]}
                            />
                            {errors.paidDate && (
                                <span className="error-message">{errors.paidDate}</span>
                            )}
                        </div>

                        {/* File uploads for online payments */}
                        {formData.paymentMethod === 'ONLINE' && (
                            <div className="file-upload-section">
                                <h5>Payment Proof Documents (Optional)</h5>
                                <p className="section-description">
                                    Upload payment screenshots or receipts as proof of online payment
                                </p>
                                
                                <div className="upload-grid">
                                    {/* Rent Bill Screenshot */}
                                    <div className="form-group">
                                        <ui.Label htmlFor="rentBillScreenshot">Rent Bill Screenshot</ui.Label>
                                        <ui.ImageUpload
                                            onFilesChange={(files) => handleFieldChange('rentBillScreenshot', files[0] || null)}
                                            accept="image/*"
                                            maxSize={5 * 1024 * 1024}
                                            multiple={false}
                                            maxFiles={1}
                                        />
                                    </div>

                                    {/* Electricity Bill Screenshot */}
                                    <div className="form-group">
                                        <ui.Label htmlFor="electricityBillScreenshot">Electricity Bill Screenshot</ui.Label>
                                        <ui.ImageUpload
                                            onFilesChange={(files) => handleFieldChange('electricityBillScreenshot', files[0] || null)}
                                            accept="image/*"
                                            maxSize={5 * 1024 * 1024}
                                            multiple={false}
                                            maxFiles={1}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="modal-actions">
                    <ui.Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Cancel
                    </ui.Button>
                    <ui.Button
                        variant="primary"
                        onClick={handleSubmit}
                        loading={submitting}
                        leftIcon={<ui.Icons name="check" size={16} />}
                    >
                        {submitting ? 'Updating Payment...' : 'Mark as Paid'}
                    </ui.Button>
                </div>
            </div>
        </div>
    );
};

export default MemberPaymentUpdateModal;