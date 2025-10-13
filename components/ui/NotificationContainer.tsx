import React from 'react';
import { useNotification } from '../../hooks/useNotification';
import NotificationToast from './NotificationToast';

const NotificationContainer: React.FC = () => {
    const { notifications, dismissNotification } = useNotification();

    return (
        <div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-3">
            {notifications.map(notification => (
                <NotificationToast
                    key={notification.id}
                    notification={notification}
                    onDismiss={() => dismissNotification(notification.id)}
                />
            ))}
        </div>
    );
};

export default NotificationContainer;
