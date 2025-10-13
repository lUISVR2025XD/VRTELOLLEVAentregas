import React, { useState } from 'react';
import { UserRole, Profile } from '../types';
import { USER_ROLES } from '../constants';
import { authService } from '../services/authService';
import { businessService } from '../services/businessService';
import { deliveryService } from '../services/deliveryService';
import Button from './ui/Button';
import { X, User, Briefcase, Bike, ShieldCheck, Mail, Key } from 'lucide-react';

interface AuthModalProps {
    onLoginSuccess: (user: Profile) => void;
    onClose: () => void;
}

const ICONS: { [key in UserRole]?: React.ElementType } = {
  [UserRole.CLIENT]: User,
  [UserRole.BUSINESS]: Briefcase,
  [UserRole.DELIVERY]: Bike,
  [UserRole.ADMIN]: ShieldCheck
};

const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess, onClose }) => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (isLoginMode) {
                const user = await authService.login(email, password);
                 if (user) {
                    onLoginSuccess(user);
                }
            } else {
                const user = await authService.register(name, email, password, role);
                if (user) {
                     if (user.role === UserRole.BUSINESS) {
                        await businessService.registerBusiness({ id: user.id, name: user.name, email: user.email });
                    } else if (user.role === UserRole.DELIVERY) {
                        await deliveryService.registerDeliveryPerson({ id: user.id, name: user.name, email: user.email });
                    }
                    onLoginSuccess(user);
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-[#2C0054] border-2 border-purple-800 rounded-2xl shadow-2xl p-8 max-w-md w-full relative transform transition-all duration-300">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10">
                    <X className="h-6 w-6" />
                </button>
                <h2 className="text-3xl font-bold text-center text-white mb-4">
                    {isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {!isLoginMode && (
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Nombre Completo"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full p-3 pl-10 border border-white/20 rounded-lg bg-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            />
                        </div>
                    )}
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="email"
                            placeholder="Correo Electrónico"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-3 pl-10 border border-white/20 rounded-lg bg-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                    </div>
                    <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-3 pl-10 border border-white/20 rounded-lg bg-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                    </div>
                    
                    {!isLoginMode && (
                        <div>
                             <p className="text-sm text-gray-300 mb-2">Selecciona tu rol:</p>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                 {USER_ROLES.filter(r => r.id !== UserRole.ADMIN).map(r => {
                                     const Icon = ICONS[r.id];
                                     return (
                                        <button 
                                            key={r.id} 
                                            type="button"
                                            onClick={() => setRole(r.id)}
                                            className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-colors ${role === r.id ? 'border-purple-500 bg-purple-900/50' : 'border-white/20 hover:border-purple-400'}`}
                                        >
                                            {Icon && <Icon className="h-6 w-6 mb-1" />}
                                            <span className="text-sm font-semibold">{r.name}</span>
                                        </button>
                                     )
                                 })}
                             </div>
                        </div>
                    )}

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <Button type="submit" className="w-full text-lg py-3 bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                        {isLoading ? 'Cargando...' : (isLoginMode ? 'Ingresar' : 'Registrarse')}
                    </Button>
                </form>

                <p className="text-center mt-6 text-sm text-gray-300">
                    {isLoginMode ? "¿No tienes una cuenta?" : "¿Ya tienes una cuenta?"}
                    <button onClick={() => { setIsLoginMode(!isLoginMode); setError(null); }} className="font-semibold text-purple-400 hover:underline ml-1">
                        {isLoginMode ? 'Regístrate' : 'Inicia Sesión'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthModal;