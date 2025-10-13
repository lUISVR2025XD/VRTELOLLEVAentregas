import { Product } from '../types';

const PRODUCT_DB_KEY = 'productDB';

const MOCK_PRODUCTS: Product[] = [
    // Taquería El Pastor (b1)
    { id: 'p1', business_id: 'b1', name: 'Tacos al Pastor (3)', category: 'Parrilladas', price: 60, description: 'Deliciosos tacos con piña y cilantro.', image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?q=80&w=1770&auto=format=fit=crop', is_available: true },
    { id: 'p2', business_id: 'b1', name: 'Gringa de Sirloin', category: 'Parrilladas', price: 85, description: 'Carne de sirloin con queso en tortilla de harina.', image: 'https://picsum.photos/seed/gringa/400/300', is_available: true },
    { id: 'p3', business_id: 'b1', name: 'Agua de Horchata', category: 'Bebidas', price: 25, description: 'Refrescante agua de horchata casera.', image: 'https://picsum.photos/seed/horchata/400/300', is_available: false },
    { id: 'p4', business_id: 'b1', name: 'Alambre de Pechuga', category: 'Alambres', price: 145, description: 'Pechuga de pollo, pimiento, cebolla y queso.', image: 'https://picsum.photos/seed/alambre/400/300', is_available: true },

    // Sushi Express (b2)
    { id: 'p5', business_id: 'b2', name: 'California Roll', category: 'Entradas', price: 120, description: 'Rollo de sushi con surimi, aguacate y pepino.', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2070&auto=format=fit=crop', is_available: true },
    { id: 'p6', business_id: 'b2', name: 'Té Verde', category: 'Bebidas', price: 30, description: 'Té verde japonés, caliente o frío.', image: 'https://picsum.photos/seed/te-verde/400/300', is_available: true },

    // Pizza Bella (b3)
    { id: 'p7', business_id: 'b3', name: 'Pizza Pepperoni Grande', category: 'Pizzas', price: 180, description: 'Clásica pizza con pepperoni de alta calidad.', image: 'https://images.unsplash.com/photo-1594041183521-72322374c498?q=80&w=1770&auto=format=fit=crop', is_available: true },

    // Burger Joint (b4)
    { id: 'p8', business_id: 'b4', name: 'Doble Queso Hamburguesa', category: 'Hamburguesas', price: 150, description: 'Con doble carne, doble queso y tocino.', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=2072&auto=format=fit=crop', is_available: true },
];

const initializeProductDB = (): Product[] => {
    const db = localStorage.getItem(PRODUCT_DB_KEY);
    if (db) {
        try {
            const parsed = JSON.parse(db);
            if(Array.isArray(parsed) && parsed.length > 0) {
              return parsed;
            }
        } catch (e) {
            localStorage.setItem(PRODUCT_DB_KEY, JSON.stringify(MOCK_PRODUCTS));
            return MOCK_PRODUCTS;
        }
    }
    localStorage.setItem(PRODUCT_DB_KEY, JSON.stringify(MOCK_PRODUCTS));
    return MOCK_PRODUCTS;
};

let productDB = initializeProductDB();

const saveDB = () => {
    localStorage.setItem(PRODUCT_DB_KEY, JSON.stringify(productDB));
};

export const productService = {
    getProductsByBusinessId: (businessId: string): Promise<Product[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                productDB = initializeProductDB(); // Resync
                const products = productDB.filter(p => p.business_id === businessId);
                resolve(products);
            }, 300);
        });
    },

    addProduct: (productData: Omit<Product, 'id'>): Promise<Product> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const newProduct: Product = {
                    id: `prod-${Date.now()}`,
                    ...productData,
                };
                productDB.unshift(newProduct);
                saveDB();
                resolve(newProduct);
            }, 200);
        });
    },

    updateProduct: (productId: string, updates: Partial<Product>): Promise<Product> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const productIndex = productDB.findIndex(p => p.id === productId);
                if (productIndex === -1) {
                    return reject(new Error('Product not found'));
                }
                productDB[productIndex] = { ...productDB[productIndex], ...updates };
                saveDB();
                resolve(productDB[productIndex]);
            }, 200);
        });
    },

    deleteProduct: (productId: string): Promise<void> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                productDB = productDB.filter(p => p.id !== productId);
                saveDB();
                resolve();
            }, 200);
        });
    },
};