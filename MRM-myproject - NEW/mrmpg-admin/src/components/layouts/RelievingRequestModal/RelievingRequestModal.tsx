import React from 'react';
import ui from '@/components/ui';
import { formatDate, formatCurrency } from '@/utils';
import type { RelievingRequestData } from '@/types/apiResponseTypes';

interface RelievingRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    memberData: RelievingRequestData | null;
    onProcessRequest?: (requestId: string) => void; // Optional callback to open settlement modal
}

const RelievingRequestModal: React.FC<RelievingRequestModalProps> = ({
    isOpen,
    onClose,
    memberData,
    onProcessRequest
}) => {
    if (!isOpen || !memberData) return null;

    const isPending = memberData.status === 'PENDING';
    const isApproved = memberData.status === 'APPROVED';

    const handleProcessRequest = () => {
        if (onProcessRequest) {
            onProcessRequest(memberData.id);
        }
    };

    return (
        <div className="relieving-request-modal">
            <div className="relieving-request-modal__backdrop" onClick={onClose} />
            <div className="relieving-request-modal__container">
                <div className="relieving-request-modal__header">
                    <div className="relieving-request-modal__title">
                        <h2>Relieving Request Details</h2>
                        <span className="relieving-request-modal__subtitle">
                            Review member's request to leave the PG
                        </span>
                    </div>
                    <button 
                        className="relieving-request-modal__close"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <ui.Icons name="x" size={24} />
                    </button>
                </div>

                <div className="relieving-request-modal__body">
                    <div className="relieving-request-modal__content">
                        {/* Member Profile Section */}
                        <div className="relieving-request-modal__section">
                            <div className="relieving-request-modal__profile">
                                <div className="profile-avatar">
                                    <div className="avatar-placeholder">
                                        <ui.Icons name="user" size={32} />
                                    </div>
                                </div>
                                <div className="profile-info">
                                    <h3 className="member-name">{memberData.memberName}</h3>
                                    <div className="member-id">ID: {memberData.memberMemberId}</div>
                                    <div className="member-status">
                                        <span className={`status-badge status-badge--${memberData.status.toLowerCase()}`}>
                                            {memberData.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Request Details Section */}
                        <div className="relieving-request-modal__section">
                            <h4 className="section-title">Request Information</h4>
                            <div className="details-grid">
                                <div className="detail-item">
                                    <span className="label">Requested Leave Date</span>
                                    <span className="value">{formatDate(memberData.requestedLeaveDate)}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Reason for Leaving</span>
                                    <span className="value reason-text">{memberData.reason}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Request Date</span>
                                    <span className="value">
                                        {memberData.createdAt ? formatDate(memberData.createdAt) : 'N/A'}
                                    </span>
                                </div>
                                {memberData.feedback && (
                                    <div className="detail-item">
                                        <span className="label">User Feedback</span>
                                        <span className="value">{memberData.feedback}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Member Details Section */}
                        <div className="relieving-request-modal__section">
                            <h4 className="section-title">Member Details</h4>
                            <div className="details-grid">
                                <div className="detail-item">
                                    <span className="label">Age</span>
                                    <span className="value">{memberData.memberAge}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Phone</span>
                                    <span className="value">{memberData.memberPhone}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Email</span>
                                    <span className="value">{memberData.memberEmail}</span>
                                </div>
                            </div>
                        </div>

                        {/* Accommodation Details Section */}
                        <div className="relieving-request-modal__section">
                            <h4 className="section-title">Accommodation Details</h4>
                            <div className="details-grid">
                                <div className="detail-item">
                                    <span className="label">PG Name</span>
                                    <span className="value">{memberData.pgName}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">PG Location</span>
                                    <span className="value">{memberData.pgLocation}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Room Number</span>
                                    <span className="value">{memberData.roomNo || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Monthly Rent</span>
                                    <span className="value">
                                        {memberData.roomRent ? formatCurrency(memberData.roomRent) : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Financial Details Section */}
                        <div className="relieving-request-modal__section">
                            <h4 className="section-title">Financial Information</h4>
                            <div className="financial-details">
                                <div className="financial-item">
                                    <span className="label">Pending Dues</span>
                                    <span className="value amount pending">
                                        {formatCurrency(memberData.pendingDues)}
                                    </span>
                                </div>
                                <div className="financial-item final-amount">
                                    <span className="label">Final Settlement Amount</span>
                                    <span className="value amount final">
                                        {formatCurrency(memberData.finalAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer with Action Button for Pending Requests - Now inside scrollable body */}
                    <div className="relieving-request-modal__footer">
                        <div className="footer-actions">
                            <div className="status-info">
                                {isPending ? (
                                    <div className="pending-status">
                                        <div className="status-message">
                                            <ui.Icons name="clock" size={20} className="status-icon status-icon--pending" />
                                            <span>This request is pending review and requires action</span>
                                        </div>
                                        <div className="action-buttons">
                                            <ui.Button
                                                variant="outline"
                                                onClick={onClose}
                                            >
                                                Close
                                            </ui.Button>
                                            <ui.Button
                                                variant="primary"
                                                onClick={handleProcessRequest}
                                                leftIcon={<ui.Icons name="settings" size={16} />}
                                            >
                                                Process Request
                                            </ui.Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="processed-status">
                                        <div className="status-message">
                                            <ui.Icons 
                                                name={isApproved ? "checkCircle" : "xCircle"} 
                                                size={20} 
                                                className={`status-icon ${isApproved ? 'status-icon--success' : 'status-icon--error'}`}
                                            />
                                            <span>
                                                Request {isApproved ? 'approved' : 'rejected'} 
                                                {memberData.approvedAt ? ` on ${formatDate(memberData.approvedAt)}` : ''}
                                            </span>
                                        </div>
                                        
                                        {isApproved && (
                                            <div className="settlement-summary">
                                                <div className="settlement-item">
                                                    <span className="label">Settlement Amount:</span>
                                                    <span className="value">
                                                        {memberData.finalAmount ? formatCurrency(memberData.finalAmount) : 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="settlement-item">
                                                    <span className="label">Payment Method:</span>
                                                    <span className="value">
                                                        {memberData.paymentMethod || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="action-buttons">
                                            <ui.Button
                                                variant="primary"
                                                onClick={onClose}
                                            >
                                                Close
                                            </ui.Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RelievingRequestModal;