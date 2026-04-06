import React, { useState, useEffect } from "react";
import "./PaymentQuickViewModal.scss";
import ui from "@/components/ui";
import layouts from "@/components/layouts";
import type { PaymentQuickViewData } from "@/types/apiResponseTypes";

interface PaymentQuickViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    memberData: PaymentQuickViewData | null;
    onApprovePayment?: (paymentId: string) => void;
    onRejectPayment?: (paymentId: string) => void;
    onPaymentUpdated?: () => void;
    approveLoading?: boolean;
    rejectLoading?: boolean;
}

const PaymentQuickViewModal: React.FC<PaymentQuickViewModalProps> = ({
    isOpen,
    onClose,
    memberData,
    onApprovePayment,
    onRejectPayment,
    onPaymentUpdated,
    approveLoading = false,
    rejectLoading = false
}) => {
    const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
    const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
    const [paymentUpdateModalOpen, setPaymentUpdateModalOpen] = useState(false);

    // Lock/unlock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            // Store the current scroll position
            const scrollY = window.scrollY;
            
            // Apply styles to lock scroll
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
            
            return () => {
                // Restore scroll position and unlock
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.style.overflow = '';
                
                // Restore scroll position
                window.scrollTo(0, scrollY);
            };
        }
    }, [isOpen]);

    if (!isOpen || !memberData) return null;

    const handleDocumentClick = (url: string) => {
        setSelectedDocument(url);
        setDocumentViewerOpen(true);
    };

    const handleCloseDocumentViewer = () => {
        setDocumentViewerOpen(false);
        setSelectedDocument(null);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Not Paid';
        }
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved': return 'success';
            case 'pending': return 'warning';
            case 'rejected': return 'error';
            case 'overdue': return 'error';
            default: return 'info';
        }
    };

    const getMonthName = (month: number) => {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[month - 1];
    };

    return (
        <>
            <div className="payment-quick-view-modal-overlay" onClick={onClose}>
                <div className="payment-quick-view-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="payment-quick-view-modal__header">
                        <div className="header-content">
                            <h2>Payment Approval - {getMonthName(memberData.paymentDetails.month)} {memberData.paymentDetails.year}</h2>
                        </div>
                        <ui.Button
                            variant="ghost"
                            size="small"
                            onClick={onClose}
                            className="close-button"
                        >
                            <ui.Icons name="close" size={20} />
                        </ui.Button>
                    </div>

                    <div className="payment-quick-view-modal__content">
                        {/* Header Summary Card */}
                        <div className="section header-summary">
                            <div className="member-overview">
                                <div className="member-avatar">
                                    {memberData.profileImage ? (
                                        <ui.AuthenticatedImage 
                                            src={memberData.profileImage} 
                                            alt={memberData.name}
                                            className="avatar-image"
                                        />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            <ui.Icons name="user" size={32} />
                                        </div>
                                    )}
                                </div>
                                <div className="member-summary">
                                    <h3 className="member-name">{memberData.name}</h3>
                                    <p className="member-id">ID: {memberData.memberId}</p>
                                    <div className="member-badges">
                                        <span className={`badge badge--${memberData.rentType.toLowerCase()}`}>
                                            {memberData.rentType === 'LONG_TERM' ? 'Long Term' : 'Short Term'}
                                        </span>
                                        <span className={`badge badge--${getStatusColor(memberData.paymentDetails.paymentStatus)}`}>
                                            {memberData.paymentDetails.paymentStatus}
                                        </span>
                                    </div>
                                </div>
                                <div className="payment-overview">
                                    <div className="payment-amount">
                                        <span className="amount-label">Payment Amount</span>
                                        <span className="amount-value">{formatCurrency(memberData.paymentDetails.amount)}</span>
                                    </div>
                                    <div className="payment-period">
                                        <span className="period-label">Period</span>
                                        <span className="period-value">
                                            {getMonthName(memberData.paymentDetails.month)} {memberData.paymentDetails.year}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Grid */}
                        <div className="content-grid">
                            {/* Left Column */}
                            <div className="content-left">
                                {/* Member Details */}
                                <div className="info-card">
                                    <div className="card-header">
                                        <ui.Icons name="user" size={18} />
                                        <h4>Member Information</h4>
                                    </div>
                                    <div className="card-content">
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <label>Age</label>
                                                <span>{memberData.dob ? (() => {
                                                    const birthDate = new Date(memberData.dob);
                                                    const today = new Date();
                                                    let age = today.getFullYear() - birthDate.getFullYear();
                                                    const monthDiff = today.getMonth() - birthDate.getMonth();
                                                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                                        age--;
                                                    }
                                                    return age;
                                                })() : 'N/A'} years</span>
                                            </div>
                                            <div className="info-item">
                                                <label>Gender</label>
                                                <span>{memberData.gender}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>Work</label>
                                                <span>{memberData.work}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>Location</label>
                                                <span>{memberData.location}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>Phone</label>
                                                <span>{memberData.phone}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>Email</label>
                                                <span className="text-truncate">{memberData.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* PG & Room Details */}
                                <div className="info-card">
                                    <div className="card-header">
                                        <ui.Icons name="home" size={18} />
                                        <h4>PG & Room Details</h4>
                                    </div>
                                    <div className="card-content">
                                        <div className="info-grid">
                                            <div className="info-item full-width">
                                                <label>PG Name</label>
                                                <span>{memberData.pgName}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>PG Location</label>
                                                <span>{memberData.pgLocation}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>Room No</label>
                                                <span>{memberData.roomNo}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>Monthly Rent</label>
                                                <span className="amount-highlight">{formatCurrency(memberData.rent)}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>Advance Amount</label>
                                                <span className="amount-highlight">{formatCurrency(memberData.advanceAmount)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="content-right">
                                {/* Payment Status */}
                                <div className="info-card">
                                    <div className="card-header">
                                        <ui.Icons name="creditCard" size={18} />
                                        <h4>Payment Status</h4>
                                    </div>
                                    <div className="card-content">
                                        <div className="status-grid">
                                            <div className="status-item">
                                                <div className="status-label">Payment Status</div>
                                                <span className={`status-badge status-badge--${getStatusColor(memberData.paymentDetails.paymentStatus)}`}>
                                                    {memberData.paymentDetails.paymentStatus}
                                                </span>
                                            </div>
                                            <div className="status-item">
                                                <div className="status-label">Approval Status</div>
                                                <span className={`status-badge status-badge--${getStatusColor(memberData.paymentDetails.approvalStatus)}`}>
                                                    {memberData.paymentDetails.approvalStatus}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Timeline */}
                                <div className="info-card">
                                    <div className="card-header">
                                        <ui.Icons name="calendar" size={18} />
                                        <h4>Payment Timeline</h4>
                                    </div>
                                    <div className="card-content">
                                        <div className="timeline-grid">
                                            <div className="timeline-item">
                                                <label>Due Date</label>
                                                <span>{formatDate(memberData.paymentDetails.dueDate)}</span>
                                            </div>
                                            <div className="timeline-item">
                                                <label>Overdue Date</label>
                                                <span className="text-danger">{formatDate(memberData.paymentDetails.overdueDate)}</span>
                                            </div>
                                            <div className="timeline-item">
                                                <label>Attempt Number</label>
                                                <span className="attempt-badge">#{memberData.paymentDetails.attemptNumber}</span>
                                            </div>
                                            <div className="timeline-item">
                                                <label>Paid Date</label>
                                                <span className={memberData.paymentDetails.paidDate && !isNaN(new Date(memberData.paymentDetails.paidDate).getTime()) ? "text-success" : "text-muted"}>
                                                    {memberData.paymentDetails.paidDate ? formatDate(memberData.paymentDetails.paidDate) : 'Not Paid'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Screenshots Section */}
                        <div className="section payment-screenshots">
                            <div className="section-header">
                                <ui.Icons name="image" size={20} />
                                <h3>Payment Screenshots</h3>
                                <span className="section-subtitle">Click on any screenshot to view in full size</span>
                            </div>
                            
                            <div className="screenshots-container">
                                <div className="screenshot-card">
                                    <div className="screenshot-header">
                                        <ui.Icons name="fileText" size={16} />
                                        <span>Rent Bill Screenshot</span>
                                    </div>
                                    {memberData.paymentDetails.rentBillScreenshot ? (
                                        <div 
                                            className="screenshot-preview"
                                            onClick={() => handleDocumentClick(memberData.paymentDetails.rentBillScreenshot!)}
                                        >
                                            <ui.AuthenticatedImage
                                                src={memberData.paymentDetails.rentBillScreenshot}
                                                alt="Rent Bill Screenshot"
                                                className="screenshot-image"
                                            />
                                            <div className="screenshot-overlay">
                                                <ui.Icons name="eye" size={24} />
                                                <span>View Full Size</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="screenshot-empty">
                                            <ui.Icons name="image" size={32} />
                                            <span>No rent bill screenshot uploaded</span>
                                        </div>
                                    )}
                                </div>

                                <div className="screenshot-card">
                                    <div className="screenshot-header">
                                        <ui.Icons name="fileText" size={16} />
                                        <span>Electricity Bill Screenshot</span>
                                    </div>
                                    {memberData.paymentDetails.electricityBillScreenshot ? (
                                        <div 
                                            className="screenshot-preview"
                                            onClick={() => handleDocumentClick(memberData.paymentDetails.electricityBillScreenshot!)}
                                        >
                                            <ui.AuthenticatedImage
                                                src={memberData.paymentDetails.electricityBillScreenshot}
                                                alt="Electricity Bill Screenshot"
                                                className="screenshot-image"
                                            />
                                            <div className="screenshot-overlay">
                                                <ui.Icons name="eye" size={24} />
                                                <span>View Full Size</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="screenshot-empty">
                                            <ui.Icons name="image" size={32} />
                                            <span>No electricity bill screenshot uploaded</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="payment-quick-view-modal__actions">
                        {/* Manual Update Button - Always available for admins */}
                        <ui.Button
                            variant="outline"
                            onClick={() => setPaymentUpdateModalOpen(true)}
                            disabled={approveLoading || rejectLoading}
                            leftIcon={<ui.Icons name="edit" size={16} />}
                            className="update-payment-button"
                        >
                            Mark as Paid
                        </ui.Button>

                        {/* Approval buttons - Only for PAID payments pending approval */}
                        {memberData.paymentDetails.paymentStatus === 'PAID' && memberData.paymentDetails.approvalStatus === 'PENDING' && (
                            <>
                                <ui.Button
                                    variant="outline"
                                    onClick={() => onRejectPayment?.(memberData.paymentDetails.id)}
                                    loading={rejectLoading}
                                    disabled={approveLoading}
                                    leftIcon={<ui.Icons name="xCircle" size={16} />}
                                    className="reject-button"
                                >
                                    Reject Payment
                                </ui.Button>
                                <ui.Button
                                    variant="primary"
                                    onClick={() => onApprovePayment?.(memberData.paymentDetails.id)}
                                    loading={approveLoading}
                                    disabled={rejectLoading}
                                    leftIcon={<ui.Icons name="checkCircle" size={16} />}
                                    className="approve-button"
                                >
                                    Approve Payment
                                </ui.Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Document Viewer Modal */}
            {documentViewerOpen && selectedDocument && (
                <ui.DocumentViewer
                    isOpen={documentViewerOpen}
                    onClose={handleCloseDocumentViewer}
                    imageUrl={selectedDocument}
                />
            )}

            {/* Member Payment Update Modal */}
            <layouts.MemberPaymentUpdateModal
                isOpen={paymentUpdateModalOpen}
                onClose={() => setPaymentUpdateModalOpen(false)}
                paymentData={memberData ? {
                    id: memberData.paymentDetails.id,
                    memberName: memberData.name,
                    amount: memberData.paymentDetails.amount,
                    month: memberData.paymentDetails.month,
                    year: memberData.paymentDetails.year,
                    currentStatus: memberData.paymentDetails.paymentStatus,
                    dueDate: memberData.paymentDetails.dueDate
                } : null}
                onPaymentUpdated={() => {
                    setPaymentUpdateModalOpen(false);
                    onPaymentUpdated?.();
                }}
            />
        </>
    );
};

export default PaymentQuickViewModal;
