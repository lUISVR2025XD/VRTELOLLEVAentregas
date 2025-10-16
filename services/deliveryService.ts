import { DeliveryPerson, UserRole } from '../types';
import { notificationService } from './notificationService';
import { Bike } from 'lucide-react';

const DELIVERY_DB_KEY = 'deliveryDB';

const MOCK_DELIVERY_PEOPLE: DeliveryPerson[] = [
    {
        id: 'delivery-1', name: 'Pedro Repartidor', phone: '55-1111-2222', email: 'pedro@repartidor.com', vehicle: 'Motocicleta Italika FT150', rating: 4.9, rating_count: 45, is_online: true, location: { lat: 19.4280, lng: -99.1380 }, current_deliveries: 1,
        approvalStatus: 'approved', isActive: true, documents: [],
        image: 'https://i.pravatar.cc/150?u=delivery-1', address: 'Av. Insurgentes Sur 123, Roma Norte',
        adscrito_al_negocio_id: 'b3'
    },
    {
        id: 'delivery-2', name: 'Sofia Veloz', phone: '55-3333-4444', email: 'sofia@repartidor.com', vehicle: 'Bicicleta de Montaña', rating: 4.7, rating_count: 22, is_online: false, location: { lat: 19.4310, lng: -99.1360 }, current_deliveries: 0,
        approvalStatus: 'approved', isActive: false, documents: [],
        image: 'https://i.pravatar.cc/150?u=delivery-2', address: 'Calle de la Amargura 45, Condesa'
    },
    {
        id: 'delivery-3', name: 'Carlos Nuevo', phone: '55-5555-6666', email: 'carlos@nuevo.com', vehicle: 'Automóvil Nissan March', rating: 0, rating_count: 0, is_online: false, location: { lat: 19.4350, lng: -99.1410 }, current_deliveries: 0,
        approvalStatus: 'approved', isActive: true, documents: [
            { name: 'Licencia de Conducir', url: '#', type: 'image' },
            { name: 'Tarjeta de Circulación', url: '#', type: 'pdf' }
        ],
        image: 'https://i.pravatar.cc/150?u=delivery-3', address: 'Dirección pendiente',
        adscrito_al_negocio_id: 'b3'
    },
    {
        id: 'delivery-4', name: 'Laura Rechazada', phone: '55-7777-8888', email: 'laura@rechazada.com', vehicle: 'Scooter Eléctrico', rating: 0, rating_count: 0, is_online: false, location: { lat: 19.4290, lng: -99.1390 }, current_deliveries: 0,
        approvalStatus: 'rejected', isActive: false, documents: [],
        image: '', address: ''
    }
];

const initializeDeliveryDB = (): DeliveryPerson[] => {
    const db = localStorage.getItem(DELIVERY_DB_KEY);
    if (db) {
        try {
            return JSON.parse(db);
        } catch (e) {
            console.error("Could not parse deliveryDB, resetting.", e);
            localStorage.setItem(DELIVERY_DB_KEY, JSON.stringify(MOCK_DELIVERY_PEOPLE));
            return MOCK_DELIVERY_PEOPLE;
        }
    }
    localStorage.setItem(DELIVERY_DB_KEY, JSON.stringify(MOCK_DELIVERY_PEOPLE));
    return MOCK_DELIVERY_PEOPLE;
};

let deliveryDB = initializeDeliveryDB();

const saveDB = () => {
    localStorage.setItem(DELIVERY_DB_KEY, JSON.stringify(deliveryDB));
};

export const deliveryService = {
    getAllDeliveryPeople: (): Promise<DeliveryPerson[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                deliveryDB = initializeDeliveryDB();
                resolve([...deliveryDB]);
            }, 300);
        });
    },

    updateDeliveryPerson: (personId: string, updates: Partial<DeliveryPerson>): Promise<DeliveryPerson> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                deliveryDB = initializeDeliveryDB();
                const personIndex = deliveryDB.findIndex(p => p.id === personId);
                if (personIndex === -1) {
                    return reject(new Error('Delivery person not found'));
                }
                deliveryDB[personIndex] = { ...deliveryDB[personIndex], ...updates };
                saveDB();
                resolve(deliveryDB[personIndex]);
            }, 200);
        });
    },

    registerDeliveryPerson: (personDetails: { id: string; name: string; email: string; }): Promise<DeliveryPerson> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const newPerson: DeliveryPerson = {
                    id: personDetails.id,
                    name: personDetails.name,
                    email: personDetails.email,
                    phone: '',
                    vehicle: 'Pendiente',
                    rating: 0,
                    is_online: false,
                    location: { lat: 19.4326, lng: -99.1332 },
                    current_deliveries: 0,
                    approvalStatus: 'pending',
                    isActive: false,
                    image: '',
                    address: 'Dirección pendiente',
                };
                deliveryDB.unshift(newPerson);
                saveDB();

                notificationService.sendNotification({
                    id: `new-delivery-${Date.now()}`,
                    role: UserRole.ADMIN,
                    title: 'Nueva Solicitud de Repartidor',
                    message: `El repartidor "${newPerson.name}" se ha registrado y espera aprobación.`,
                    type: 'info',
                    icon: Bike,
                });

                resolve(newPerson);
            }, 200);
        });
    },
};