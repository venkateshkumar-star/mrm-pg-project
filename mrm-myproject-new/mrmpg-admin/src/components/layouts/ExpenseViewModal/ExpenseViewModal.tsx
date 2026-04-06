import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ui from '@/components/ui';
import type { ExpenseEntry } from '@/types/apiResponseTypes';
import './ExpenseViewModal.scss';

export interface ExpenseViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    expense: ExpenseEntry | null;
}

const ExpenseViewModal: React.FC<ExpenseViewModalProps> = ({
    isOpen,
    onClose,
    expense
}) => {
    const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
    const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            // Lock body scroll when modal is open
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = '0';
            document.body.style.left = '0';
            document.body.style.right = '0';
            document.body.style.bottom = '0';
            
            // Handle escape key
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    onClose();
                }
            };
            
            document.addEventListener('keydown', handleEscape);
            
            return () => {
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.left = '';
                document.body.style.right = '';
                document.body.style.bottom = '';
                document.removeEventListener('keydown', handleEscape);
            };
        }
    }, [isOpen, onClose]);

    const handleImageClick = (imageUrl: string) => {
        setSelectedImageUrl(imageUrl);
        setIsDocumentViewerOpen(true);
    };

    const handleDocumentViewerClose = () => {
        setIsDocumentViewerOpen(false);
        setSelectedImageUrl('');
    };

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!mounted || !isOpen || !expense) return null;

    console.log('ExpenseViewModal rendering:', { isOpen, expense }); // Debug log

    const modalContent = (
        <>
            {/* Overlay */}
            <div className="expense-view-modal-overlay" onClick={onClose}>
                {/* Modal */}
                <div 
                    className="expense-view-modal"
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
                >
                    {/* Header */}
                    <div className="expense-view-modal__header">
                        <div className="expense-view-modal__title-section">
                            <h2 className="expense-view-modal__title">Expense Details</h2>
                            <span 
                                className={`expense-view-modal__type-badge expense-view-modal__type-badge--${
                                    expense.entryType === 'CASH_IN' ? 'income' : 'expense'
                                }`}
                            >
                                {expense.entryType === 'CASH_IN' ? 'Cash In' : 'Cash Out'}
                            </span>
                        </div>
                        <button 
                            className="expense-view-modal__close-btn"
                            onClick={onClose}
                            type="button"
                            aria-label="Close modal"
                        >
                            <ui.Icons name="close" />
                        </button>
                    </div>

                {/* Content */}
                <div className="expense-view-modal__content">
                    {/* Basic Information */}
                    <div className="expense-view-modal__section">
                        <h3 className="expense-view-modal__section-title">Payment Info</h3>
                        <div className="expense-view-modal__info-grid">
                            <div className="expense-view-modal__info-item">
                                <label className="expense-view-modal__label">Amount</label>
                                <div 
                                    className={`expense-view-modal__amount expense-view-modal__amount--${
                                        expense.entryType === 'CASH_IN' ? 'positive' : 'negative'
                                    }`}
                                >
                                    {formatCurrency(expense.amount)}
                                </div>
                            </div>
                            
                            <div className="expense-view-modal__info-item">
                                <label className="expense-view-modal__label">Date</label>
                                <div className="expense-view-modal__value">
                                    {formatDate(expense.date)}
                                </div>
                            </div>
                            
                            <div className="expense-view-modal__info-item">
                                <label className="expense-view-modal__label">Party Name</label>
                                <div className="expense-view-modal__value">
                                    {expense.partyName || '-'}
                                </div>
                            </div>
                            
                            <div className="expense-view-modal__info-item">
                                <label className="expense-view-modal__label">Payment Type</label>
                                <div className="expense-view-modal__value">
                                    <span className={`expense-view-modal__payment-type expense-view-modal__payment-type--${
                                        expense.paymentType?.toLowerCase() || 'cash'
                                    }`}>
                                        {expense.paymentType || 'Cash'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="expense-view-modal__info-item">
                                <label className="expense-view-modal__label">PG Location</label>
                                <div className="expense-view-modal__value">
                                    {expense.pgName || '-'}
                                </div>
                            </div>
                            
                            <div className="expense-view-modal__info-item">
                                <label className="expense-view-modal__label">Added By</label>
                                <div className="expense-view-modal__value">
                                    {expense.adminName || '-'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Remarks */}
                    {expense.remarks && (
                        <div className="expense-view-modal__section">
                            <h3 className="expense-view-modal__section-title">Remarks</h3>
                            <div className="expense-view-modal__remarks">
                                {expense.remarks}
                            </div>
                        </div>
                    )}

                    {/* Attachments */}
                    {(expense.attachedBill1 || expense.attachedBill2 || expense.attachedBill3) && (
                        <div className="expense-view-modal__section">
                            <h3 className="expense-view-modal__section-title">
                                Attachments
                            </h3>
                            <div className="expense-view-modal__attachments">
                                {[expense.attachedBill1, expense.attachedBill2, expense.attachedBill3]
                                    .filter(Boolean)
                                    .map((billUrl, index) => (
                                        <div 
                                            key={index}
                                            className="expense-view-modal__attachment"
                                            onClick={() => handleImageClick(billUrl!)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    handleImageClick(billUrl!);
                                                }
                                            }}
                                        >
                                            <div className="expense-view-modal__attachment-preview">
                                                <ui.AuthenticatedImage
                                                    src={billUrl!}
                                                    alt={`Attachment ${index + 1}`}
                                                    className="expense-view-modal__attachment-image"
                                                />
                                                <div className="expense-view-modal__attachment-overlay">
                                                    <ui.Icons name="eye" size={16} />
                                                </div>
                                            </div>
                                            <div className="expense-view-modal__attachment-info">
                                                <div className="expense-view-modal__attachment-name">
                                                    Bill {index + 1}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>

                    {/* Footer */}
                    <div className="expense-view-modal__footer">
                        <ui.Button
                            variant="outline"
                            onClick={onClose}
                        >
                            Close
                        </ui.Button>
                    </div>
                </div>
            </div>

            {/* Document Viewer */}
            <ui.DocumentViewer
                isOpen={isDocumentViewerOpen}
                imageUrl={selectedImageUrl}
                onClose={handleDocumentViewerClose}
                title="Expense Attachment"
            />
        </>
    );

    return createPortal(modalContent, document.body);
};

export default ExpenseViewModal;