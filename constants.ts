
import { OrderStatus, UserRole } from './types';

export const APP_NAME = "vrtelolleva";

export const USER_ROLES = [
  { id: UserRole.CLIENT, name: 'Cliente' },
  { id: UserRole.BUSINESS, name: 'Negocio' },
  { id: UserRole.DELIVERY, name: 'Repartidor' },
  { id: UserRole.ADMIN, name: 'Administrador' },
];

export const USER_ROLE_MAP: { [key in UserRole]: { text: string; color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' } } = {
    [UserRole.VISITOR]: { text: 'Visitante', color: 'secondary' },
    [UserRole.CLIENT]: { text: 'Cliente', color: 'primary' },
    [UserRole.BUSINESS]: { text: 'Negocio', color: 'warning' },
    [UserRole.DELIVERY]: { text: 'Repartidor', color: 'success' },
    [UserRole.ADMIN]: { text: 'Admin', color: 'danger' },
};

export const ORDER_STATUS_MAP: { [key in OrderStatus]: { text: string; color: string } } = {
  [OrderStatus.PENDING]: { text: 'Pendiente', color: 'bg-yellow-500' },
  [OrderStatus.ACCEPTED]: { text: 'Aceptado', color: 'bg-blue-500' },
  [OrderStatus.REJECTED]: { text: 'Rechazado', color: 'bg-red-600' },
  [OrderStatus.IN_PREPARATION]: { text: 'En Preparación', color: 'bg-indigo-500' },
  [OrderStatus.READY_FOR_PICKUP]: { text: 'Listo para Recoger', color: 'bg-purple-500' },
  [OrderStatus.ON_THE_WAY]: { text: 'En Camino', color: 'bg-cyan-500' },
  [OrderStatus.DELIVERED]: { text: 'Entregado', color: 'bg-green-500' },
  [OrderStatus.CANCELLED]: { text: 'Cancelado', color: 'bg-gray-500' },
};

export const QUICK_MESSAGES_DELIVERY = [
  "Estoy en la puerta",
  "Llego en 15 minutos",
  "Llego en 10 minutos",
  "No encuentro el domicilio",
];

export const QUICK_MESSAGES_CLIENT = [
    "Espero en la puerta",
    "Llamar al llegar",
    "Entregar en recepción",
];

export const MOCK_USER_LOCATION = { lat: 19.4326, lng: -99.1332 }; // Mexico City Zocalo