
import { Order, OrderStatus, QuickMessage, Business, DeliveryPerson, UserRole, CartItem, Product, PaymentMethod } from '../types';

const ORDER_DB_KEY = 'orderDB';

// --- MOCK DATA HELPERS ---
const getRandomDate = (start: Date, end: Date): string => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
};

const mockBusinesses: Partial<Business>[] = [
    { id: 'b1', name: 'Taquería El Pastor' },
    { id: 'b2', name: 'Sushi Express' },
    { id: 'b3', name: 'Pizza Bella' },
    { id: 'b4', name: 'Burger Joint' },
];

const mockDeliveryPeople: Partial<DeliveryPerson>[] = [
    { id: 'delivery-1', name: 'Pedro Repartidor' },
    { id: 'delivery-2', name: 'Sofia Veloz' },
];

// FIX: Added the missing `is_available` property to the mock product data.
const mockItems: Partial<CartItem>[] = [
    { product: { id: 'p1', name: 'Tacos', price: 60, business_id: 'b1', category: 'Mexicana', description: '', image: '', is_available: true }, quantity: 2 },
    { product: { id: 'p2', name: 'Pizza', price: 180, business_id: 'b3', category: 'Italiana', description: '', image: '', is_available: true }, quantity: 1 },
    { product: { id: 'p3', name: 'Hamburguesa', price: 150, business_id: 'b4', category: 'Americana', description: '', image: '', is_available: true }, quantity: 1 },
    { product: { id: 'p4', name: 'Sushi Roll', price: 120, business_id: 'b2', category: 'Japonesa', description: '', image: '', is_available: true }, quantity: 3 },
];

// --- MOCK HISTORICAL ORDERS ---
const MOCK_ORDERS_INITIAL: Order[] = Array.from({ length: 20 }, (_, i) => {
    const business = mockBusinesses[i % mockBusinesses.length];
    const deliveryPerson = mockDeliveryPeople[i % mockDeliveryPeople.length];
    const items = [mockItems[i % mockItems.length] as CartItem];
    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const delivery_fee = 30;
    const statusOptions = [OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REJECTED];
    
    return {
        id: `order-hist-${i + 1}`,
        client_id: `client-${i % 2 + 1}`,
        business_id: business.id!,
        business: business as Business,
        delivery_person_id: deliveryPerson.id!,
        delivery_person: deliveryPerson as DeliveryPerson,
        items: items,
        total_price: subtotal + delivery_fee,
        delivery_fee: delivery_fee,
        status: statusOptions[i % statusOptions.length],
        delivery_address: `Calle Falsa ${123 + i}, Colonia Centro`,
        delivery_location: { lat: 19.4326, lng: -99.1332 },
        payment_method: PaymentMethod.CASH,
        created_at: getRandomDate(new Date(2024, 5, 1), new Date()),
        is_rated: i % 3 === 0,
    };
});


const initializeOrderDB = (): Order[] => {
    const db = localStorage.getItem(ORDER_DB_KEY);
    if (db) {
        try {
            const parsed = JSON.parse(db);
            // If the DB is empty, initialize it with mock data
            if (Array.isArray(parsed) && parsed.length === 0) {
                 localStorage.setItem(ORDER_DB_KEY, JSON.stringify(MOCK_ORDERS_INITIAL));
                 return MOCK_ORDERS_INITIAL;
            }
            return parsed;
        } catch (e) {
            console.error("Could not parse orderDB, resetting.", e);
            localStorage.setItem(ORDER_DB_KEY, JSON.stringify(MOCK_ORDERS_INITIAL));
            return MOCK_ORDERS_INITIAL;
        }
    }
    localStorage.setItem(ORDER_DB_KEY, JSON.stringify(MOCK_ORDERS_INITIAL));
    return MOCK_ORDERS_INITIAL;
};

let orderDB = initializeOrderDB();

const saveDB = () => {
    localStorage.setItem(ORDER_DB_KEY, JSON.stringify(orderDB));
};

export const orderService = {
    getOrders: (filters: { businessId?: string; clientId?: string; status?: OrderStatus }): Promise<Order[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                orderDB = initializeOrderDB(); // Re-sync with localStorage
                let orders = [...orderDB];
                if (filters.businessId) {
                    orders = orders.filter(o => o.business_id === filters.businessId);
                }
                if (filters.clientId) {
                    orders = orders.filter(o => o.client_id === filters.clientId);
                }
                if (filters.status) {
                    orders = orders.filter(o => o.status === filters.status);
                }
                resolve(orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            }, 200);
        });
    },
    
    createOrder: (newOrder: Order): Promise<Order> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                orderDB.unshift(newOrder);
                saveDB();
                resolve(newOrder);
            }, 200);
        });
    },

    updateOrder: (orderId: string, updates: Partial<Order>): Promise<Order | null> => {
        return new Promise((resolve, reject) => {
             setTimeout(() => {
                const orderIndex = orderDB.findIndex(o => o.id === orderId);
                if (orderIndex === -1) {
                    return reject(new Error('Order not found'));
                }
                orderDB[orderIndex] = { ...orderDB[orderIndex], ...updates };
                saveDB();
                resolve(orderDB[orderIndex]);
            }, 200);
        });
    },

    addMessageToOrder: (orderId: string, message: QuickMessage): Promise<Order | null> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const orderIndex = orderDB.findIndex(o => o.id === orderId);
                if (orderIndex === -1) {
                    return reject(new Error('Order not found'));
                }
                const order = orderDB[orderIndex];
                if (!order.messages) {
                    order.messages = [];
                }
                order.messages.push(message);
                orderDB[orderIndex] = order;
                saveDB();
                resolve(order);
            }, 150);
        });
    },
};