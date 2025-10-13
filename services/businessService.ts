import { Business, BusinessLoad, Location, Product, UserRole } from '../types';
import { notificationService } from './notificationService';
import { Briefcase } from 'lucide-react';

const BUSINESS_DB_KEY = 'businessDB';

// Mock data to initialize the DB.
const MOCK_BUSINESSES: Business[] = [
    { id: 'b1', name: 'Taquería El Pastor', category: 'Mexicana', rating: 4.8, rating_count: 152, delivery_time: '25-35 min', fixed_delivery_fee: 45.00, image: 'https://picsum.photos/seed/tacos/400/300', location: { lat: 19.4300, lng: -99.1300 }, is_open: true, phone: '55-1234-5678', address: 'Calle Falsa 123, Colonia Centro, CDMX', email: 'elpastor@negocio.com', opening_hours: 'L-D: 12:00 - 23:00', current_load: BusinessLoad.NORMAL, documents: [], approvalStatus: 'approved', isActive: true },
    { id: 'b2', name: 'Sushi Express', category: 'Japonesa', rating: 4.6, rating_count: 88, delivery_time: '30-40 min', fixed_delivery_fee: 0, image: 'https://picsum.photos/seed/sushi/400/300', location: { lat: 19.4350, lng: -99.1400 }, is_open: true, phone: '55-8765-4321', address: 'Avenida Siempre Viva 742, Roma Norte, CDMX', email: 'sushi@negocio.com', opening_hours: 'M-S: 13:00 - 22:00', current_load: BusinessLoad.BUSY, documents: [], approvalStatus: 'approved', isActive: true },
    { id: 'b3', name: 'Pizza Bella', category: 'Italiana', rating: 4.9, rating_count: 213, delivery_time: '20-30 min', fixed_delivery_fee: 35.50, image: 'https://picsum.photos/seed/pizza/400/300', location: { lat: 19.4290, lng: -99.1350 }, is_open: false, phone: '55-5555-5555', address: 'Plaza Central 1, Condesa, CDMX', email: 'pizza@negocio.com', opening_hours: 'L-V: 11:00 - 21:00', current_load: BusinessLoad.NORMAL, documents: [], approvalStatus: 'approved', isActive: false },
    { id: 'b4', name: 'Burger Joint', category: 'Americana', rating: 4.5, rating_count: 340, delivery_time: '35-45 min', fixed_delivery_fee: 0, image: 'https://picsum.photos/seed/burger/400/300', location: { lat: 19.4380, lng: -99.1310 }, is_open: true, phone: '55-1122-3344', address: 'Boulevard del Sabor 55, Polanco, CDMX', email: 'burger@negocio.com', opening_hours: 'L-D: 10:00 - 22:30', current_load: BusinessLoad.VERY_BUSY, documents: [], approvalStatus: 'approved', isActive: true },
    { id: 'b5', name: 'Café El Dicho', category: 'Cafetería', rating: 0, rating_count: 0, delivery_time: '15-25 min', fixed_delivery_fee: 0, image: 'https://picsum.photos/seed/cafe/400/300', location: { lat: 19.4310, lng: -99.1390 }, is_open: false, phone: '55-9988-7766', address: 'Callejón del Beso 10', email: 'cafe@dicho.com', opening_hours: 'L-V: 08:00 - 18:00', current_load: BusinessLoad.NORMAL, documents: [], approvalStatus: 'pending', isActive: false },
];


const initializeBusinessDB = (): Business[] => {
    const db = localStorage.getItem(BUSINESS_DB_KEY);
    if (db) {
        try {
            return JSON.parse(db);
        } catch (e) {
            console.error("Could not parse businessDB, resetting.", e);
            localStorage.setItem(BUSINESS_DB_KEY, JSON.stringify(MOCK_BUSINESSES));
            return MOCK_BUSINESSES;
        }
    }
    localStorage.setItem(BUSINESS_DB_KEY, JSON.stringify(MOCK_BUSINESSES));
    return MOCK_BUSINESSES;
};

let businessDB = initializeBusinessDB();

const saveDB = () => {
    localStorage.setItem(BUSINESS_DB_KEY, JSON.stringify(businessDB));
};

export const businessService = {
    getAllBusinesses: (): Promise<Business[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                businessDB = initializeBusinessDB();
                resolve([...businessDB]);
            }, 300);
        });
    },

    getBusinessById: (businessId: string): Promise<Business | undefined> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                businessDB = initializeBusinessDB();
                const business = businessDB.find(b => b.id === businessId);
                resolve(business);
            }, 200);
        });
    },

    updateBusiness: (businessId: string, updates: Partial<Business>): Promise<Business> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                businessDB = initializeBusinessDB();
                const businessIndex = businessDB.findIndex(b => b.id === businessId);
                if (businessIndex === -1) {
                    return reject(new Error('Business not found'));
                }
                businessDB[businessIndex] = { ...businessDB[businessIndex], ...updates };
                saveDB();
                resolve(businessDB[businessIndex]);
            }, 200);
        });
    },

    registerBusiness: (businessDetails: { id: string; name: string; email: string; }): Promise<Business> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const newBusiness: Business = {
                    id: businessDetails.id,
                    name: businessDetails.name,
                    email: businessDetails.email,
                    category: 'Sin categoría',
                    rating: 0,
                    delivery_time: 'N/A',
                    fixed_delivery_fee: 30.00,
                    image: `https://picsum.photos/seed/${businessDetails.id}/400/300`,
                    location: { lat: 19.4326, lng: -99.1332 },
                    is_open: false,
                    phone: '',
                    address: 'Dirección pendiente',
                    opening_hours: 'N/A',
                    approvalStatus: 'pending',
                    isActive: false,
                };
                businessDB.unshift(newBusiness);
                saveDB();

                notificationService.sendNotification({
                    id: `new-biz-${Date.now()}`,
                    role: UserRole.ADMIN,
                    title: 'Nueva Solicitud de Negocio',
                    message: `El negocio "${newBusiness.name}" se ha registrado y espera aprobación.`,
                    type: 'info',
                    icon: Briefcase,
                });

                resolve(newBusiness);
            }, 200);
        });
    },
};