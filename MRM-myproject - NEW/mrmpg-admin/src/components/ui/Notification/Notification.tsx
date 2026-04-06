import React, { useEffect, useState } from 'react';
import './Notification.scss';
import ui from '@/components/ui';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // Duration in milliseconds, 0 for persistent
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationItemProps {
  notification: NotificationData;
  onClose: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const showTimer = setTimeout(() => setIsVisible(true), 50);

    // Auto-close timer
    let autoCloseTimer: NodeJS.Timeout;
    if (notification.duration && notification.duration > 0) {
      autoCloseTimer = setTimeout(() => {
        handleClose();
      }, notification.duration);
    }

    return () => {
      clearTimeout(showTimer);
      if (autoCloseTimer) clearTimeout(autoCloseTimer);
    };
  }, [notification.duration]);

  const handleClose = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 300); // Match the exit animation duration
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <ui.Icons name="checkCircle2" size={20} />;
      case 'error':
        return <ui.Icons name="xCircle" size={20} />;
      case 'warning':
        return <ui.Icons name="alertTriangle" size={20} />;
      case 'info':
        return <ui.Icons name="info" size={20} />;
      default:
        return <ui.Icons name="info" size={20} />;
    }
  };

  return (
    <div
      className={`notification-item notification-item--${notification.type} ${
        isVisible ? 'notification-item--visible' : ''
      } ${isRemoving ? 'notification-item--removing' : ''}`}
    >
      <div className="notification-content">
        <div className="notification-icon">
          {getIcon()}
        </div>
        
        <div className="notification-text">
          <div className="notification-title">
            {notification.title}
          </div>
          {notification.message && (
            <div className="notification-message">
              {notification.message}
            </div>
          )}
        </div>

        <div className="notification-actions">
          {notification.action && (
            <button
              className="notification-action-button"
              onClick={notification.action.onClick}
            >
              {notification.action.label}
            </button>
          )}
          <button
            className="notification-close-button"
            onClick={handleClose}
            aria-label="Close notification"
          >
            <ui.Icons name="close" size={16} />
          </button>
        </div>
      </div>

      {/* Progress bar for auto-close notifications */}
      {notification.duration && notification.duration > 0 && (
        <div 
          className="notification-progress"
          style={{
            animationDuration: `${notification.duration}ms`
          }}
        />
      )}
    </div>
  );
};

export default NotificationItem;
