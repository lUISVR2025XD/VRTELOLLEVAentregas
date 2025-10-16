
import React, { useState, useEffect } from 'react';
import { UserRole, Profile } from './types';
import ClientDashboard from './pages/ClientDashboard';
import BusinessDashboard from './pages/BusinessDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import AdminDashboard from './pages/AdminDashboard';
import HomePage from './pages/HomePage';
import AuthModal from './components/AuthModal';
import Button from './components/ui/Button';
import { authService } from './services/authService';
import { NotificationProvider } from './hooks/useNotification';
import NotificationContainer from './components/ui/NotificationContainer';
import { usePushNotifications } from './hooks/usePushNotifications';


const PushNotificationManager: React.FC = () => {
    const { isSupported, permission, requestNotificationPermission } = usePushNotifications();

    // Don't show if not supported, or if a decision has been made
    if (!isSupported || permission === 'granted' || permission === 'denied') {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 bg-purple-800 text-white p-4 rounded-lg shadow-lg z-50 animate-fade-in border border-teal-500/50 max-w-sm">
            <h4 className="font-bold">¡Mantente al día!</h4>
            <p className="mb-3 text-sm text-gray-300">Activa las notificaciones para recibir actualizaciones de tus pedidos en tiempo real.</p>
            <Button onClick={requestNotificationPermission} className="w-full !bg-teal-500 hover:!bg-teal-600 !text-white !border-teal-400">
                Activar Notificaciones
            </Button>
        </div>
    );
};

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

    useEffect(() => {
        // Check for a logged-in user in the session
        const user = authService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
        }
        setIsLoading(false);
    }, []);

    const handleLoginSuccess = (user: Profile) => {
        setCurrentUser(user);
        setIsAuthModalVisible(false);
    };

    const handleLogout = () => {
        authService.logout();
        setCurrentUser(null);
    };
    
    const requestLogin = () => {
        setIsAuthModalVisible(true);
    };

    const renderDashboard = () => {
        if (!currentUser) return null;

        switch (currentUser.role) {
            case UserRole.CLIENT:
                return <ClientDashboard user={currentUser} onLogout={handleLogout} />;
            case UserRole.BUSINESS:
                return <BusinessDashboard user={currentUser} onLogout={handleLogout} />;
            case UserRole.DELIVERY:
                return <DeliveryDashboard user={currentUser} onLogout={handleLogout} />;
            case UserRole.ADMIN:
                return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
            default:
                // Should not happen if a user is logged in
                return <HomePage onLoginRequest={requestLogin} />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#1A0129] text-white">
                <div className="text-center">
                    <svg className="animate-spin h-10 w-10 text-purple-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <h1 className="text-2xl font-bold mt-4">vrtelolleva</h1>
                    <p>Cargando tu próxima comida...</p>
                </div>
            </div>
        );
    }

    return (
        <NotificationProvider>
            <div className="min-h-screen bg-transparent text-gray-100">
                <NotificationContainer />
                {currentUser ? (
                    renderDashboard()
                ) : (
                    <>
                      <HomePage onLoginRequest={requestLogin} />
                      {isAuthModalVisible && <AuthModal onLoginSuccess={handleLoginSuccess} onClose={() => setIsAuthModalVisible(false)} />}
                    </>
                )}
                {currentUser && <PushNotificationManager />}
            </div>
        </NotificationProvider>
    );
};

export default App;