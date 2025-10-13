import { Notification } from '../types';

type NotificationListener = (notification: Notification) => void;

class NotificationService {
    private listeners: Set<NotificationListener> = new Set();

    subscribe(listener: NotificationListener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    sendNotification(notification: Notification) {
        console.log("Sending notification:", notification);
        // 1. Show in-app toast to all listeners
        this.listeners.forEach(listener => listener(notification));

        // 2. Send to service worker for a push notification (if permission is granted)
        if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then(registration => {
                // The service worker's 'message' event listener will pick this up
                registration.active?.postMessage(notification);
            });
        }
    }
}

// Export a singleton instance
export const notificationService = new NotificationService();