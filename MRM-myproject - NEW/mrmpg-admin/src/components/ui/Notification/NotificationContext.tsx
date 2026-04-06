import React, { createContext, useContext, useState, useCallback } from 'react';
import NotificationContainer from './NotificationContainer';
import type { NotificationData } from './Notification';

interface NotificationContextType {
  showNotification: (notification: Omit<NotificationData, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  showSuccess: (title: string, message?: string, duration?: number) => string;
  showError: (title: string, message?: string, duration?: number) => string;
  showWarning: (title: string, message?: string, duration?: number) => string;
  showInfo: (title: string, message?: string, duration?: number) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
  defaultDuration?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 5,
  defaultDuration = 5000
}) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const showNotification = useCallback((notification: Omit<NotificationData, 'id'>) => {
    const id = generateId();
    const newNotification: NotificationData = {
      ...notification,
      id,
      duration: notification.duration ?? defaultDuration
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Limit the number of notifications
      if (updated.length > maxNotifications) {
        return updated.slice(0, maxNotifications);
      }
      return updated;
    });

    return id;
  }, [defaultDuration, maxNotifications]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods for different notification types
  const showSuccess = useCallback((title: string, message?: string, duration?: number) => {
    return showNotification({ type: 'success', title, message, duration });
  }, [showNotification]);

  const showError = useCallback((title: string, message?: string, duration?: number) => {
    return showNotification({ type: 'error', title, message, duration: duration ?? 0 }); // Errors persist by default
  }, [showNotification]);

  const showWarning = useCallback((title: string, message?: string, duration?: number) => {
    return showNotification({ type: 'warning', title, message, duration });
  }, [showNotification]);

  const showInfo = useCallback((title: string, message?: string, duration?: number) => {
    return showNotification({ type: 'info', title, message, duration });
  }, [showNotification]);

  const contextValue: NotificationContextType = {
    showNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  );
};
