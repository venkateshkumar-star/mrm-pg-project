import React from 'react';
import './Notification.scss';
import NotificationItem from './Notification';
import type { NotificationData } from './Notification';

interface NotificationContainerProps {
  notifications: NotificationData[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onRemove,
  position = 'top-right'
}) => {
  if (notifications.length === 0) return null;

  return (
    <div className={`notification-container notification-container--${position}`}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={onRemove}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
