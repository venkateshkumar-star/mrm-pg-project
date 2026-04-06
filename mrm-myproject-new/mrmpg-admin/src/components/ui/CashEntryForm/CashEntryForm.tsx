import React, { useState, useEffect, useCallback } from 'react';
import ui from '@/components/ui';
import { ApiClient } from '@/utils';
import { useNotification } from '@/hooks/useNotification';
import type { PgListResponse, PgListOption } from '@/types/apiResponseTypes';
import './CashEntryForm.scss';

export type CashEntryType = 'CASH_IN' | 'CASH_OUT';
export type PaymentType = 'CASH' | 'ONLINE';

export interface CashEntryFormData {
    type: CashEntryType;
    date: string;
    amount: string;
    partyName: string;
    pgId: string;
    remarks: string;
    paymentType: PaymentType;
    attachments?: File[]; // Array of uploaded files for form submission
}

export interface CashEntryFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CashEntryFormData) => void;
    onSaveAndAddNew: (data: CashEntryFormData) => void;
    initialType?: CashEntryType;
}

const CashEntryForm: React.FC<CashEntryFormProps> = ({
    isOpen,
    onClose,
    onSave,
    onSaveAndAddNew,
    initialType = 'CASH_IN'
}) => {
    const notification = useNotification();
    const [activeTab, setActiveTab] = useState<CashEntryType>(initialType);
    
    // PG dropdown state
    const [pgOptions, setPgOptions] = useState<PgListOption[]>([]);
    const [pgLoading, setPgLoading] = useState(false);
    const [pgLoadAttempted, setPgLoadAttempted] = useState(false);
    
    const [formData, setFormData] = useState<CashEntryFormData>({
        type: initialType,
        date: new Date().toISOString().split('T')[0],
        amount: '',
        partyName: '',
        pgId: '',
        remarks: '',
        paymentType: 'CASH',
        attachments: []
    });

    // Store selected files for upload
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const handleTabChange = (tabId: string) => {
        const tab = tabId as CashEntryType;
        setActiveTab(tab);
        setFormData(prev => ({ ...prev, type: tab }));
    };

    const handleInputChange = (field: keyof CashEntryFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePaymentTypeChange = (value: PaymentType) => {
        setFormData(prev => ({ ...prev, paymentType: value }));
    };

    // Handle attachment file changes
    const handleFilesChange = (files: File[]) => {
        setSelectedFiles(files);
        setFormData(prev => ({ 
            ...prev, 
            attachments: files
        }));
    };

    // Fetch PG options from backend
    const fetchPgOptions = useCallback(async () => {
        setPgLoading(true);
        setPgLoadAttempted(true);
        try {
            const response = await ApiClient.get('/filters/admin-pg-locations') as PgListResponse;
            if (response.success && response.data?.options) {
                setPgOptions(response.data.options);
            } else {
                notification.showError(
                    'Failed to load PG options',
                    response.message || 'Please try again',
                    3000
                );
            }
        } catch {
            notification.showError(
                'Error loading PG options',
                'Please check your network connection',
                3000
            );
        } finally {
            setPgLoading(false);
        }
    }, [notification]);

    // Load PG options when form opens
    useEffect(() => {
        if (isOpen && !pgLoadAttempted) {
            fetchPgOptions();
        }
    }, [isOpen, pgLoadAttempted, fetchPgOptions]);

    // Update active tab and form type when initialType prop changes
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialType);
            setFormData(prev => ({ ...prev, type: initialType }));
        }
    }, [isOpen, initialType]);

    const isFormValid = () => {
        return formData.date && 
               formData.amount && 
               parseFloat(formData.amount) > 0 &&
               formData.partyName.trim() &&
               formData.pgId.trim();
    };

    const handleSave = () => {
        if (isFormValid()) {
            // Include files in the form data for submission
            const finalFormData = {
                ...formData,
                attachments: selectedFiles
            };
            onSave(finalFormData);
        }
    };

    const handleSaveAndAddNew = () => {
        if (isFormValid()) {
            // Include files in the form data for submission
            const finalFormData = {
                ...formData,
                attachments: selectedFiles
            };
            onSaveAndAddNew(finalFormData);
            // Reset form for new entry
            setFormData({
                type: activeTab,
                date: new Date().toISOString().split('T')[0],
                amount: '',
                partyName: '',
                pgId: '',
                remarks: '',
                paymentType: 'CASH',
                attachments: []
            });
            setSelectedFiles([]);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div className="cash-entry-overlay" onClick={onClose} />
            
            {/* Form */}
            <div className="cash-entry-form">
                {/* Header */}
                <div className="cash-entry-form__header">
                    <h2 className="cash-entry-form__title">Add Cash Entry</h2>
                    <button 
                        className="cash-entry-form__close-btn"
                        onClick={onClose}
                        type="button"
                    >
                        <ui.Icons name="close" />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="cash-entry-form__nav">
                    <ui.Tabs
                        tabs={[
                            {
                                id: 'CASH_IN',
                                label: 'Cash In'
                            },
                            {
                                id: 'CASH_OUT',
                                label: 'Cash Out'
                            }
                        ]}
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                        fullWidth={true}
                        showCounts={false}
                        size="medium"
                    />
                </div>

                {/* Form Body */}
                <div className="cash-entry-form__body">
                    <form className="cash-entry-form__form">
                        {/* Date Input */}
                        <div className="cash-entry-form__field">
                            <ui.Label htmlFor="date" required>Date</ui.Label>
                            <ui.DateInput
                                id="date"
                                value={formData.date}
                                onChange={(value: string) => handleInputChange('date', value)}
                            />
                        </div>

                        {/* Amount Input */}
                        <div className="cash-entry-form__field">
                            <ui.Input
                                type="number"
                                id="amount"
                                label="Amount"
                                value={formData.amount}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('amount', e.target.value)}
                                placeholder="Enter amount"
                                required
                                min="0"
                                step="0.01"
                            />
                        </div>

                        {/* Party Name */}
                        <div className="cash-entry-form__field">
                            <ui.Input
                                type="text"
                                id="partyName"
                                label="Party Name (Contact)"
                                value={formData.partyName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('partyName', e.target.value)}
                                placeholder="Enter contact/party name"
                                required
                            />
                        </div>

                        {/* PG Selection */}
                        <div className="cash-entry-form__field">
                            <ui.Label htmlFor="pgSelection" required>Select PG</ui.Label>
                            <ui.Select
                                id="pgSelection"
                                value={formData.pgId}
                                onChange={(value: string) => handleInputChange('pgId', value)}
                                options={pgOptions.map(pg => ({
                                    value: pg.value,
                                    label: pg.label
                                }))}
                                placeholder="Choose PG"
                                disabled={pgLoading}
                            />
                            {pgLoading && <span className="loading-text">Loading PGs...</span>}
                        </div>

                        {/* Payment Type */}
                        <div className="cash-entry-form__field">
                            <ui.Label htmlFor="paymentType" required>Payment Type</ui.Label>
                            <ui.Radio
                                id="paymentType"
                                value={formData.paymentType}
                                options={[
                                    { label: 'Cash', value: 'CASH' },
                                    { label: 'Online', value: 'ONLINE' }
                                ]}
                                onChange={(value: string) => handlePaymentTypeChange(value as PaymentType)}
                            />
                        </div>

                        {/* Remarks */}
                        <div className="cash-entry-form__field">
                            <ui.Label htmlFor="remarks">Remarks</ui.Label>
                            <textarea
                                id="remarks"
                                className="cash-entry-form__textarea"
                                value={formData.remarks}
                                onChange={(e) => handleInputChange('remarks', e.target.value)}
                                placeholder="Enter remarks or additional notes..."
                                rows={3}
                            />
                        </div>

                        {/* Bill Attachments */}
                        <div className="cash-entry-form__field">
                            <ui.Label htmlFor="attachments">
                                Bill/Receipt Attachments 
                                <span className="cash-entry-form__field-optional"> (Optional)</span>
                            </ui.Label>
                            <div className="cash-entry-form__upload-wrapper">
                                <ui.ImageUpload
                                    maxSize={3 * 1024 * 1024} // 3MB for bills
                                    maxFiles={3}
                                    multiple={true}
                                    accept="image/*,.pdf"
                                    onFilesChange={handleFilesChange}
                                    onUploadError={(error) => {
                                        console.error('Upload error:', error);
                                        notification.showError(
                                            'File Error',
                                            error,
                                            3000
                                        );
                                    }}
                                    className="cash-entry-form__image-upload"
                                />
                                <p className="cash-entry-form__upload-note">
                                    Upload bills, receipts, or payment screenshots for this {activeTab === 'CASH_IN' ? 'income' : 'expense'} entry
                                </p>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="cash-entry-form__footer">
                    <ui.Button
                        variant="outline"
                        onClick={handleSave}
                        disabled={!isFormValid()}
                    >
                        Save
                    </ui.Button>
                    <ui.Button
                        variant="primary"
                        onClick={handleSaveAndAddNew}
                        disabled={!isFormValid()}
                    >
                        Save & Add New
                    </ui.Button>
                </div>
            </div>
        </>
    );
};

export default CashEntryForm;