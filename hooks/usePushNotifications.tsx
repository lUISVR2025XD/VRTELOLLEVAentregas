import { useState, useEffect, useCallback } from 'react';

export const usePushNotifications = () => {
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        if ('Notification' in window && 'serviceWorker' in navigator) {
            setIsSupported(true);
            setPermission(Notification.permission);
        }
        setIsInitializing(false);
    }, []);

    const requestNotificationPermission = useCallback(async () => {
        if (!isSupported) {
            console.error("Notifications not supported");
            return;
        }
        const currentPermission = await Notification.requestPermission();
        setPermission(currentPermission);
        return currentPermission;
    }, [isSupported]);
    
    return {
        isSupported,
        permission,
        isInitializing,
        requestNotificationPermission,
    };
};
