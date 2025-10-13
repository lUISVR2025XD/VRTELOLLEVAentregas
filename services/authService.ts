import { Profile, UserRole, Location } from '../types';

// In a real app, this would be a secure, hashed password in a database.
// We are storing it plaintext here ONLY for simulation purposes.
interface UserCredentials extends Profile {
    password_insecure: string;
}

// --- MOCK DATABASE ---
// Simulates a user table in a database, initialized with some data.
const initializeMockDB = (): UserCredentials[] => {
    const db = localStorage.getItem('userDB');
    if (db) {
        return JSON.parse(db);
    }
    const mockUsers: UserCredentials[] = [
        { id: 'client-1', name: 'Ana Cliente', role: UserRole.CLIENT, email: 'ana@cliente.com', location: { lat: 19.4350, lng: -99.1350 }, password_insecure: 'password123', isActive: true, address: 'Avenida Siempre Viva 742, CDMX' },
        { id: 'b1', name: 'Taquería El Pastor', role: UserRole.BUSINESS, email: 'elpastor@negocio.com', location: { lat: 19.4300, lng: -99.1300 }, password_insecure: 'password123', isActive: true },
        { id: 'delivery-1', name: 'Pedro Repartidor', role: UserRole.DELIVERY, email: 'pedro@repartidor.com', location: { lat: 19.4280, lng: -99.1380 }, password_insecure: 'password123', isActive: true },
        { id: 'admin-1', name: 'Super Admin', role: UserRole.ADMIN, email: 'admin@pronto.com', password_insecure: 'admin123', isActive: true },
        { id: 'client-2', name: 'Juan Inactivo', role: UserRole.CLIENT, email: 'juan@inactivo.com', location: { lat: 19.4350, lng: -99.1350 }, password_insecure: 'password123', isActive: false },
    ];
    localStorage.setItem('userDB', JSON.stringify(mockUsers));
    return mockUsers;
};

let userDB = initializeMockDB();

const saveDB = () => {
    localStorage.setItem('userDB', JSON.stringify(userDB));
};
// --- END MOCK DATABASE ---

// --- MOCK SESSION HANDLING ---
const SESSION_KEY = 'prontoEatsCurrentUser';

const setCurrentUserSession = (user: Profile): void => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
};

const clearCurrentUserSession = (): void => {
    localStorage.removeItem(SESSION_KEY);
};
// --- END MOCK SESSION HANDLING ---

export const authService = {
    // Simulates a login API call
    login: (email: string, password_insecure: string): Promise<Profile> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                userDB = initializeMockDB();
                const user = userDB.find(u => u.email.toLowerCase() === email.toLowerCase());
                if (!user) {
                    return reject(new Error("Usuario no encontrado."));
                }
                if (user.isActive === false) {
                    return reject(new Error("Esta cuenta ha sido desactivada."));
                }
                if (user.password_insecure !== password_insecure) {
                    return reject(new Error("Contraseña incorrecta."));
                }
                const { password_insecure: _, ...userProfile } = user;
                setCurrentUserSession(userProfile);
                resolve(userProfile);
            }, 500); // Simulate network delay
        });
    },

    // Simulates a register API call
    register: (name: string, email: string, password_insecure: string, role: UserRole): Promise<Profile> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const existingUser = userDB.find(u => u.email.toLowerCase() === email.toLowerCase());
                if (existingUser) {
                    return reject(new Error("Este correo electrónico ya está registrado."));
                }
                const newUser: UserCredentials = {
                    id: `user-${Date.now()}`,
                    name,
                    email,
                    role,
                    password_insecure,
                    location: { lat: 19.4326, lng: -99.1332 }, // Default to CDMX Zocalo
                    isActive: true,
                };
                userDB.push(newUser);
                saveDB();

                const { password_insecure: _, ...userProfile } = newUser;
                setCurrentUserSession(userProfile);
                resolve(userProfile);
            }, 500);
        });
    },
    
    // Logs the user out
    logout: (): void => {
        clearCurrentUserSession();
    },

    // Gets the current user from the session
    getCurrentUser: (): Profile | null => {
        const userJson = localStorage.getItem(SESSION_KEY);
        if (!userJson) {
            return null;
        }
        try {
            return JSON.parse(userJson) as Profile;
        } catch (error) {
            console.error("Failed to parse user from session storage", error);
            clearCurrentUserSession();
            return null;
        }
    },

    getAllUsers: (): Promise<Profile[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const profiles = userDB.map(user => {
                    const { password_insecure, ...profile } = user;
                    return profile;
                });
                resolve(profiles);
            }, 300);
        });
    },

    updateUser: (userId: string, updates: Partial<Profile>): Promise<Profile> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const userIndex = userDB.findIndex(u => u.id === userId);
                if (userIndex === -1) {
                    return reject(new Error("Usuario no encontrado."));
                }
                
                userDB[userIndex] = { ...userDB[userIndex], ...updates };
                saveDB();

                const currentUser = authService.getCurrentUser();
                if (currentUser && currentUser.id === userId) {
                    setCurrentUserSession({ ...currentUser, ...updates });
                }
                
                const { password_insecure, ...userProfile } = userDB[userIndex];
                resolve(userProfile);
            }, 300);
        });
    },
};