import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Notification, Profile, UserRole } from '../types';
import { notificationService } from '../services/notificationService';
import { authService } from '../services/authService';

interface NotificationContextType {
    notifications: Notification[];
    dismissNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [currentUser, setCurrentUser] = useState<Profile | null>(null);

    useEffect(() => {
        // We need to know who the current user is to filter notifications
        const user = authService.getCurrentUser();
        setCurrentUser(user);

        const handleNewNotification = (notification: Notification) => {
            const user = authService.getCurrentUser(); // Check again in case of login/logout
             // Only show notification if it's meant for the current user's role
            if (user && notification.role === user.role) {
                setNotifications(prev => [notification, ...prev]);
            }
        };

        const unsubscribe = notificationService.subscribe(handleNewNotification);
        return () => unsubscribe();
    }, []);

    const dismissNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, dismissNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};
