import React, { useState } from 'react';
import ui from '@/components/ui';
import { formatCurrency } from '@/utils';
import type { RelievingRequestData } from '@/types/apiResponseTypes';
import './SettlementModal.scss';

interface SettlementFormData {
    finalAmount: string;
    paymentMethod: 'CASH' | 'ONLINE';
    settlementProof?: File;
}

interface SettlementModalProps {
    isOpen: boolean;
    onClose: () => void;
    memberData: RelievingRequestData | null;
    onApprove: (requestId: string, formData: SettlementFormData) => void;
    onReject: (requestId: string) => void;
    approveLoading?: boolean;
    rejectLoading?: boolean;
}

const SettlementModal: React.FC<SettlementModalProps> = ({
    isOpen,
    onClose,
    memberData,
    onApprove,
    onReject,
    approveLoading = false,
    rejectLoading = false
}) => {
    const [formData, setFormData] = useState<SettlementFormData>({
        finalAmount: memberData?.finalAmount?.toString() || '',
        paymentMethod: 'CASH'
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    if (!isOpen || !memberData) return null;

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        
        if (!formData.finalAmount || parseFloat(formData.finalAmount) < 0) {
            errors.finalAmount = 'Please enter a valid final amount';
        }
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleApprove = () => {
        if (!validateForm()) return;
        onApprove(memberData.id, formData);
    };

    const handleReject = () => {
        onReject(memberData.id);
    };

    const handleInputChange = (field: keyof SettlementFormData, value: string) => {
        setFormData(prev => {
            const newData = {
                ...prev,
                [field]: value
            };
            
            // Clear settlement proof if payment method changes to CASH
            if (field === 'paymentMethod' && value === 'CASH') {
                delete newData.settlementProof;
            }
            
            return newData;
        });
        
        // Clear error when user starts typing
        if (formErrors[field]) {
            setFormErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const handleFileUpload = (files: File[]) => {
        if (files.length > 0) {
            setFormData(prev => ({
                ...prev,
                settlementProof: files[0]
            }));
        }
    };

    return (
        <div className="settlement-modal">
            <div className="settlement-modal__backdrop" onClick={onClose} />
            <div className="settlement-modal__container">
                <div className="settlement-modal__header">
                    <div className="settlement-modal__title">
                        <h2>Settlement Details</h2>
                        <span className="settlement-modal__subtitle">
                            Process relieving request for {memberData.memberName}
                        </span>
                    </div>
                    <button 
                        className="settlement-modal__close"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <ui.Icons name="x" size={24} />
                    </button>
                </div>

                <div className="settlement-modal__body">
                    {/* Member Summary */}
                    <div className="settlement-modal__summary">
                        <div className="member-summary">
                            <div className="member-info">
                                <h3 className="member-name">{memberData.memberName}</h3>
                                <div className="member-details">
                                    <span className="member-id">ID: {memberData.memberMemberId}</span>
                                    <span className="member-location">{memberData.pgName}</span>
                                </div>
                            </div>
                            <div className="financial-summary">
                                <div className="pending-dues">
                                    <span className="label">Pending Dues</span>
                                    <span className="amount">{formatCurrency(memberData.pendingDues)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Settlement Form */}
                    <div className="settlement-modal__form">
                        <div className="form-section">
                            <h4 className="form-title">Settlement Information</h4>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <ui.Label htmlFor="finalAmount" required>
                                        Final Settlement Amount
                                    </ui.Label>
                                    <ui.NumberInput
                                        id="finalAmount"
                                        value={parseFloat(formData.finalAmount) || 0}
                                        onChange={(value) => handleInputChange('finalAmount', value.toString())}
                                        placeholder="Enter final settlement amount"
                                        min={0}
                                        step={0.01}
                                    />
                                    {formErrors.finalAmount && (
                                        <span className="error-text">{formErrors.finalAmount}</span>
                                    )}
                                </div>
                                
                                <div className="form-group">
                                    <ui.Label htmlFor="paymentMethod" required>
                                        Payment Method
                                    </ui.Label>
                                    <ui.Select
                                        id="paymentMethod"
                                        value={formData.paymentMethod}
                                        onChange={(value) => handleInputChange('paymentMethod', value)}
                                        options={[
                                            { value: 'CASH', label: 'Cash Payment' },
                                            { value: 'ONLINE', label: 'Online Transfer' }
                                        ]}
                                    />
                                </div>
                            </div>
                            
                            {formData.paymentMethod === 'ONLINE' && (
                                <div className="form-group">
                                    <ui.Label htmlFor="settlementProof">
                                        Settlement Proof (Optional)
                                    </ui.Label>
                                    <ui.ImageUpload
                                        accept="image/*"
                                        maxFiles={1}
                                        multiple={false}
                                        onFilesChange={handleFileUpload}
                                        maxSize={5 * 1024 * 1024} // 5MB
                                        className="settlement-upload"
                                    />
                                    <span className="help-text">
                                        Upload payment receipt or settlement proof (JPG, PNG - Max 5MB)
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="settlement-modal__footer">
                    <div className="footer-actions">
                        <div className="primary-actions">
                            <ui.Button
                                variant="danger"
                                onClick={handleReject}
                                disabled={approveLoading || rejectLoading}
                                loading={rejectLoading}
                                leftIcon={rejectLoading ? undefined : <ui.Icons name="x" size={16} />}
                            >
                                {rejectLoading ? 'Rejecting...' : 'Reject Request'}
                            </ui.Button>
                            <ui.Button
                                variant="primary"
                                onClick={handleApprove}
                                disabled={approveLoading || rejectLoading}
                                loading={approveLoading}
                                leftIcon={approveLoading ? undefined : <ui.Icons name="check" size={16} />}
                            >
                                {approveLoading ? 'Processing...' : 'Approve & Settle'}
                            </ui.Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettlementModal;