import React, { useState, useEffect } from 'react';
import { Profile, Order, OrderStatus, CartItem, Business, Location, Product, UserRole, Notification, QuickMessage, BusinessLoad, PaymentMethod } from '../types';
import OrderTrackingMap from '../components/maps/OrderTrackingMap';
import { APP_NAME, ORDER_STATUS_MAP, MOCK_USER_LOCATION, QUICK_MESSAGES_CLIENT } from '../constants';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import StarRating from '../components/ui/StarRating';
import { MapPin, Bike, Clock, CheckCircle, Search, Frown, ShoppingBag, Check, ClipboardList, MessageSquare, ThumbsUp, UtensilsCrossed, PackageCheck, XCircle, Package, ChevronLeft, Save, Loader } from 'lucide-react';
import DashboardHeader from '../components/shared/DashboardHeader';
import ShoppingCart from '../components/client/ShoppingCart';
import BusinessCard from '../components/client/BusinessCard';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { notificationService } from '../services/notificationService';
import { orderService } from '../services/orderService';
import { authService } from '../services/authService';
import BusinessDetailPage from './BusinessDetailPage';
import BusinessFilters from '../components/client/BusinessFilters';
import MyOrdersPage from './MyOrdersPage';
import { useBusinessFilter } from '../hooks/useBusinessFilter';
import { businessService } from '../services/businessService';
import { productService } from '../services/productService';


// Mock API call from HomePage
const fetchNearbyBusinesses = async (location: Location): Promise<Business[]> => {
    // This is still a mock, but now it assembles data from multiple services
    // to simulate a real backend call.
    return new Promise(async (resolve) => {
        const businesses = await businessService.getAllBusinesses();
        const businessesWithProducts = await Promise.all(
            businesses.map(async (business) => {
                const products = await productService.getProductsByBusinessId(business.id);
                // Only show available products to the client
                return { ...business, products: products.filter(p => p.is_available) };
            })
        );
        resolve(businessesWithProducts);
    });
};

interface ClientDashboardProps {
  user: Profile;
  onLogout: () => void;
}

type ClientView = 'shopping' | 'businessDetail' | 'tracking' | 'history' | 'profile';

const isTrackable = (status: OrderStatus) => {
    return [
        OrderStatus.ACCEPTED,
        OrderStatus.IN_PREPARATION,
        OrderStatus.READY_FOR_PICKUP,
        OrderStatus.ON_THE_WAY
    ].includes(status);
};

const ClientDashboard: React.FC<ClientDashboardProps> = ({ user, onLogout }) => {
    const [currentView, setCurrentView] = useState<ClientView>('shopping');
    const [clientProfile, setClientProfile] = useState(user);
    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [pastOrders, setPastOrders] = useState<Order[]>([]);
    const [deliveryLocation, setDeliveryLocation] = useState<Location | undefined>(undefined);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [cartBusiness, setCartBusiness] = useState<Business | null>(null);
    const [isCartVisible, setIsCartVisible] = useState(false);
    const [prepTimeRemaining, setPrepTimeRemaining] = useState<string | null>(null);
    
    // State for shopping view
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
    const { 
        filteredBusinesses, 
        searchQuery, 
        setSearchQuery, 
        filters, 
        handleFilterChange, 
        handleClearFilters 
    } = useBusinessFilter(businesses, user.location || null);

    // State for clear cart confirmation modal
    const [isClearCartModalVisible, setIsClearCartModalVisible] = useState(false);
    const [productToAdd, setProductToAdd] = useState<Product | null>(null);
    
    // State for profile form
    const [profileForm, setProfileForm] = useState({
        name: clientProfile.name,
        phone: clientProfile.phone || '',
        address: clientProfile.address || ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setProfileForm({
            name: clientProfile.name,
            phone: clientProfile.phone || '',
            address: clientProfile.address || ''
        });
    }, [clientProfile]);


    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const businessesData = await fetchNearbyBusinesses(user.location || MOCK_USER_LOCATION);
            setBusinesses(businessesData);
           
            const ordersData = await orderService.getOrders({ clientId: user.id });
            setPastOrders(ordersData);

            // FIX: Use an arrow function to correctly pass order.status to isTrackable.
            const currentActiveOrder = ordersData.find(order => isTrackable(order.status));
            if (currentActiveOrder) {
                setActiveOrder(currentActiveOrder);
                setDeliveryLocation(currentActiveOrder.delivery_person?.location || currentActiveOrder.business?.location);
                setCurrentView('tracking');
            }

            setLoading(false);
        };
        loadData();
    }, [user.id, user.location]);

    // Simulate delivery person moving for a real-time tracking experience.
    // This effect runs when there's an active order being tracked.
    useEffect(() => {
        let intervalId: number | undefined;

        if (currentView === 'tracking' && activeOrder && activeOrder.status === OrderStatus.ON_THE_WAY) {
            // We use setInterval to periodically update the delivery person's location.
            intervalId = window.setInterval(() => {
                setDeliveryLocation(prev => {
                    if(!prev || !activeOrder) return prev;
                    
                    // Simulate movement by interpolating the position.
                    // This moves the location 10% closer to the destination every second.
                    const newLat = prev.lat + (activeOrder.delivery_location.lat - prev.lat) * 0.1;
                    const newLng = prev.lng + (activeOrder.delivery_location.lng - prev.lng) * 0.1;
                    
                    // Check if the delivery person is close enough to be considered "arrived".
                    const dist = Math.sqrt(Math.pow(activeOrder.delivery_location.lat - newLat, 2) + Math.pow(activeOrder.delivery_location.lng - newLng, 2));
                    
                    if(dist < 0.0001) { // Threshold for arrival
                         const finalOrderState = {...activeOrder, status: OrderStatus.DELIVERED};
                         setActiveOrder(finalOrderState);
                         setPastOrders(prevPast => prevPast.map(o => o.id === finalOrderState.id ? finalOrderState : o));
                         notificationService.sendNotification({
                            id: `note-${Date.now()}`,
                            role: UserRole.CLIENT,
                            orderId: finalOrderState.id,
                            title: '¡Pedido Entregado!',
                            message: `Tu pedido de ${finalOrderState.business?.name} ha llegado.`,
                            type: 'success',
                            icon: CheckCircle
                         });
                         // The interval will be cleared by the effect's cleanup function when the order status changes.
                         return activeOrder.delivery_location;
                    }
                    return { lat: newLat, lng: newLng };
                });
            }, 1000); // Update every second for a smoother, more frequent update.
        }
        
        // Cleanup function to clear the interval when the component unmounts
        // or the dependencies (activeOrder, currentView) change.
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [activeOrder, currentView]);
    
    useEffect(() => {
        const handleNotification = (notification: Notification) => {
            if (!notification.orderId || notification.role !== user.role) {
                return;
            }
        
            // Handle all order status updates by refreshing order state
            if (notification.order) {
                const updatedOrder = notification.order;
    
                // Update the main list of orders
                setPastOrders(prevOrders => {
                    const existingOrderIndex = prevOrders.findIndex(o => o.id === updatedOrder.id);
                    const newOrders = [...prevOrders];
                    if (existingOrderIndex > -1) {
                        newOrders[existingOrderIndex] = updatedOrder;
                    } else {
                         // This shouldn't happen for an update, but as a fallback
                        newOrders.unshift(updatedOrder);
                    }
                    return newOrders;
                });
    
                // Update the active order if it's the one being changed, or if a new order becomes trackable
                if ((activeOrder && activeOrder.id === updatedOrder.id) || (!activeOrder && isTrackable(updatedOrder.status))) {
                    setActiveOrder(updatedOrder);
                }
    
                // If an order becomes "ON_THE_WAY", ensure view is tracking
                if (updatedOrder.status === OrderStatus.ON_THE_WAY) {
                    setActiveOrder(updatedOrder);
                    setDeliveryLocation(updatedOrder.delivery_person?.location || updatedOrder.business?.location);
                    setCurrentView('tracking');
                }
            }
        };
    
        const unsubscribe = notificationService.subscribe(handleNotification);
        return () => unsubscribe();
    }, [user.role, activeOrder]);

    // Effect for the preparation countdown timer
    useEffect(() => {
        let intervalId: number | undefined;
    
        if (activeOrder && activeOrder.status === OrderStatus.IN_PREPARATION && activeOrder.preparation_time) {
            // When we receive the notification, we start a timer for the client.
            // We assume the timer starts *now*. A more robust system would use an `accepted_at` timestamp.
            const prepTimeInSeconds = activeOrder.preparation_time * 60;
            const endTime = Date.now() + prepTimeInSeconds * 1000;
    
            const updateTimer = () => {
                const remainingSeconds = Math.round((endTime - Date.now()) / 1000);
                if (remainingSeconds <= 0) {
                    setPrepTimeRemaining("¡Casi listo!");
                    clearInterval(intervalId);
                } else {
                    const minutes = Math.floor(remainingSeconds / 60);
                    const seconds = remainingSeconds % 60;
                    setPrepTimeRemaining(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
                }
            };
            
            updateTimer(); // Initial call to set time immediately
            intervalId = window.setInterval(updateTimer, 1000);
        } else {
            setPrepTimeRemaining(null); // Clear timer if order status changes
        }
    
        return () => clearInterval(intervalId);
    }, [activeOrder]);

    const handleUpdateOrder = (updatedOrder: Order) => {
        setPastOrders(prevOrders => prevOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    };

    const handleBusinessRatingUpdate = (businessId: string, newRating: number) => {
        setBusinesses(prevBusinesses => {
            return prevBusinesses.map(business => {
                if (business.id === businessId) {
                    const currentRating = business.rating || 0;
                    const currentCount = business.rating_count || 0;
                    
                    const newTotalRating = (currentRating * currentCount) + newRating;
                    const newCount = currentCount + 1;
                    const newAverage = newTotalRating / newCount;

                    return { 
                        ...business, 
                        rating: parseFloat(newAverage.toFixed(2)),
                        rating_count: newCount 
                    };
                }
                return business;
            });
        });
    };

    const handleAddToCart = (product: Product) => {
        const productBusiness = businesses.find(b => b.id === product.business_id);
        if (!productBusiness) return;

        if (cartBusiness && cartBusiness.id !== product.business_id) {
            setProductToAdd(product);
            setIsClearCartModalVisible(true);
            return;
        }

        if (!cartBusiness) {
            setCartBusiness(productBusiness);
        }
        
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.product.id === product.id);
            if (existingItem) {
                return prevCart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prevCart, { product, quantity: 1 }];
        });

        notificationService.sendNotification({
            id: `add-to-cart-${product.id}-${Date.now()}`,
            role: UserRole.CLIENT,
            title: 'Producto Agregado',
            message: `"${product.name}" se agregó a tu carrito.`,
            type: 'success',
            icon: ShoppingBag
        });
    };
    
    const handleConfirmClearCart = () => {
        if (!productToAdd) return;
        const productBusiness = businesses.find(b => b.id === productToAdd.business_id);
        if (productBusiness) {
            setCart([{ product: productToAdd, quantity: 1 }]);
            setCartBusiness(productBusiness);
            notificationService.sendNotification({
                id: `add-to-cart-${productToAdd.id}-${Date.now()}`,
                role: UserRole.CLIENT,
                title: 'Producto Agregado',
                message: `El carrito se limpió y "${productToAdd.name}" se agregó.`,
                type: 'success',
                icon: ShoppingBag
            });
        }
        setIsClearCartModalVisible(false);
        setProductToAdd(null);
    };

    const handleUpdateQuantity = (productId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            handleRemoveItem(productId);
            return;
        }
        setCart(cart.map(item => item.product.id === productId ? { ...item, quantity: newQuantity } : item));
    };

    const handleRemoveItem = (productId: string) => {
        const newCart = cart.filter(item => item.product.id !== productId);
        setCart(newCart);
        if (newCart.length === 0) {
            setCartBusiness(null);
        }
    };
    
    const handlePlaceOrder = async (details: { location: Location; notes: string; paymentMethod: PaymentMethod; _deliveryFee: number }) => {
        if (!cartBusiness) return;
        const deliveryFee = details._deliveryFee;
        const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

        const newOrder: Order = {
            id: `order-${Date.now()}`,
            client_id: user.id,
            client: user,
            business_id: cartBusiness.id,
            business: cartBusiness,
            items: cart,
            total_price: subtotal + deliveryFee,
            delivery_fee: deliveryFee,
            status: OrderStatus.PENDING,
            delivery_address: 'Dirección del mapa',
            delivery_location: details.location,
            payment_method: details.paymentMethod,
            special_notes: details.notes,
            created_at: new Date().toISOString(),
            delivery_person: { id: 'delivery-1', name: 'Pedro R.', location: cartBusiness.location, is_online: true, vehicle: 'Moto', current_deliveries: 1, email: '', phone: '', rating: 4.9, approvalStatus: 'approved', isActive: true},
            messages: [],
        };
        
        await orderService.createOrder(newOrder);
        setPastOrders(prev => [newOrder, ...prev]);

        notificationService.sendNotification({
            id: `note-new-order-${Date.now()}`,
            role: UserRole.BUSINESS,
            orderId: newOrder.id,
            order: newOrder,
            title: '¡Nuevo Pedido!',
            message: `Has recibido un nuevo pedido de ${user.name}.`,
            type: 'new_order',
            icon: ShoppingBag
        });
        
        notificationService.sendNotification({
            id: `note-placed-${Date.now()}`,
            role: UserRole.CLIENT,
            orderId: newOrder.id,
            title: 'Pedido Realizado',
            message: `Tu pedido a ${cartBusiness.name} ha sido enviado. Esperando confirmación.`,
            type: 'info',
            icon: Check
        });
        
        setCart([]);
        setCartBusiness(null);
        setIsCartVisible(false);
    };
    
    const handleSelectBusiness = (business: Business) => {
        setSelectedBusiness(business);
        setCurrentView('businessDetail');
    };

    const handleGoBackToList = () => {
        setSelectedBusiness(null);
        setCurrentView('shopping');
    };

    const handleTrackOrderFromHistory = (order: Order) => {
        setActiveOrder(order);
        setDeliveryLocation(order.delivery_person?.location || order.business?.location);
        setCurrentView('tracking');
    };

    const handleSendQuickMessage = async (message: string) => {
        if (!activeOrder) return;
    
        const quickMessage: QuickMessage = {
            id: `msg-${Date.now()}`,
            order_id: activeOrder.id,
            sender_id: user.id,
            recipient_id: activeOrder.delivery_person_id || '',
            message: message,
            created_at: new Date().toISOString(),
            is_read: false,
        };
    
        const updatedOrder = await orderService.addMessageToOrder(activeOrder.id, quickMessage);
    
        if (updatedOrder) {
            setActiveOrder(updatedOrder);
            setPastOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    
            notificationService.sendNotification({
                id: `note-msg-${Date.now()}`,
                role: UserRole.DELIVERY,
                orderId: activeOrder.id,
                order: updatedOrder,
                title: 'Mensaje del Cliente',
                message: `Cliente para pedido #${activeOrder.id.slice(-6)}: "${message}"`,
                type: 'info',
                icon: MessageSquare
            });
            
            notificationService.sendNotification({
                id: `note-msg-conf-${Date.now()}`,
                role: UserRole.CLIENT,
                orderId: activeOrder.id,
                title: 'Mensaje Enviado',
                message: `Tu mensaje ha sido enviado al repartidor.`,
                type: 'success',
                icon: Check
            });
        }
    };
    
    const handleProfileFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const updatedProfile = await authService.updateUser(clientProfile.id, profileForm);
            setClientProfile(updatedProfile); // Update local state to reflect changes immediately
            notificationService.sendNotification({
                id: `profile-update-${Date.now()}`,
                role: UserRole.CLIENT,
                title: 'Perfil Actualizado',
                message: 'Tu información ha sido guardada correctamente.',
                type: 'success',
                icon: CheckCircle
            });
            setCurrentView('shopping'); // Go back to shopping view after save
        } catch (error: any) {
            notificationService.sendNotification({
                id: `profile-error-${Date.now()}`,
                role: UserRole.CLIENT,
                title: 'Error al Guardar',
                message: error.message || 'No se pudo actualizar tu perfil.',
                type: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const renderOrderStatus = () => {
        if (!activeOrder) return null;
        const statusInfo = ORDER_STATUS_MAP[activeOrder.status];
        
        const steps = [
            {status: OrderStatus.ACCEPTED, label: 'Confirmado', icon: ThumbsUp},
            {status: OrderStatus.IN_PREPARATION, label: 'Preparando', icon: UtensilsCrossed},
            {status: OrderStatus.READY_FOR_PICKUP, label: 'Listo para Recoger', icon: Package},
            {status: OrderStatus.ON_THE_WAY, label: 'En Camino', icon: Bike},
            {status: OrderStatus.DELIVERED, label: 'Entregado', icon: PackageCheck},
        ];

        const getStepIndex = (status: OrderStatus) => {
             const index = steps.findIndex(s => s.status === status);
             if (index !== -1) return index;
             if ([OrderStatus.PENDING].includes(status)) return -1;
             return 0; // Default to first step if accepted but not in prep
        }

        const currentStepIndex = getStepIndex(activeOrder.status);

        return (
             <Card className="p-6 bg-white text-gray-900 shadow-lg">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-2xl font-bold">Tu pedido de <span className="text-purple-600">{activeOrder.business?.name}</span></h3>
                        <p className="text-gray-600">ID del Pedido: {activeOrder.id.slice(-6)}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-white font-semibold ${statusInfo.color}`}>{statusInfo.text}</div>
                </div>
                
                {activeOrder.status === OrderStatus.REJECTED ? (
                     <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6 text-center shadow-md">
                         <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                         <h4 className="text-2xl font-bold text-gray-900">Pedido Rechazado</h4>
                         <p className="text-gray-600 mt-2 mb-6">Lo sentimos, el negocio no pudo aceptar tu pedido en este momento. No se ha realizado ningún cargo.</p>
                         <Button onClick={() => { setActiveOrder(null); setCurrentView('shopping'); }} className="mt-6 w-full md:w-auto !bg-purple-600 !text-white hover:!bg-purple-700">Volver a Restaurantes</Button>
                     </div>
                ) : (
                    <>
                    {/* Stepper */}
                    <div className="flex items-center mb-6">
                        {steps.map((step, index) => (
                            <React.Fragment key={step.status}>
                                <div className="flex flex-col items-center text-center">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${index <= currentStepIndex ? 'bg-purple-500 text-white border-purple-500' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                                        <step.icon size={24} />
                                    </div>
                                    <p className={`mt-2 w-20 text-xs sm:text-sm font-medium transition-colors duration-300 ${index <= currentStepIndex ? 'text-gray-800' : 'text-gray-500'}`}>{step.label}</p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`flex-1 h-1 mx-1 sm:mx-2 transition-colors duration-500 ${index < currentStepIndex ? 'bg-purple-500' : 'bg-gray-200'}`}></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {activeOrder.status === OrderStatus.IN_PREPARATION && (
                        <div className="text-center my-4 p-3 bg-gray-100 rounded-lg">
                            <p className="font-semibold text-gray-800">Tu pedido estará listo en aproximadamente:</p>
                            <p className="text-2xl font-bold text-purple-600">{prepTimeRemaining || `${activeOrder.preparation_time}:00`}</p>
                        </div>
                    )}

                    {activeOrder.messages && activeOrder.messages.length > 0 && (
                        <div className="my-4">
                            <h4 className="font-semibold text-lg mb-2 flex items-center">
                                <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
                                Mensajes
                            </h4>
                            <div className="space-y-2 bg-gray-100 p-3 rounded-lg max-h-32 overflow-y-auto">
                                {activeOrder.messages.map(msg => (
                                    <p key={msg.id} className="text-sm text-gray-800">
                                        <span className={`font-semibold ${msg.sender_id === user.id ? 'text-green-700' : 'text-purple-700'}`}>
                                            {msg.sender_id === user.id ? 'Tú' : 'Repartidor'}:
                                        </span> {msg.message}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="border-t border-gray-200 mt-6 pt-4">
                        <h4 className="font-semibold text-lg mb-2">Detalles del Pedido</h4>
                        <ul className="space-y-1 text-sm mb-4">
                            {activeOrder.items.map(item => (
                                <li key={item.product.id} className="flex justify-between">
                                    <span className="text-gray-700">{item.quantity}x {item.product.name}</span>
                                    <span className="text-gray-900 font-medium">${(item.product.price * item.quantity).toFixed(2)}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="space-y-1 text-sm border-t border-gray-200 pt-2">
                            <div className="flex justify-between text-gray-600"><span>Subtotal:</span> <span>${(activeOrder.total_price - activeOrder.delivery_fee).toFixed(2)}</span></div>
                            <div className="flex justify-between text-gray-600"><span>Envío:</span> <span>${activeOrder.delivery_fee.toFixed(2)}</span></div>
                            <div className="flex justify-between font-bold text-base mt-1"><span>Total:</span> <span>${activeOrder.total_price.toFixed(2)}</span></div>
                        </div>
                        {activeOrder.special_notes && (
                            <div className="mt-4 bg-gray-100 p-3 rounded-lg">
                                <p className="font-semibold text-sm text-gray-900">Notas Especiales:</p>
                                <p className="text-gray-700 text-sm italic">"{activeOrder.special_notes}"</p>
                            </div>
                        )}
                    </div>
                    
                    {activeOrder.status === OrderStatus.DELIVERED && (
                        <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6 text-center shadow-md">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                            <h4 className="text-2xl font-bold text-gray-900">¡Tu pedido ha sido entregado!</h4>
                            <p className="text-gray-600 mt-2 mb-6">Puedes calificar tu experiencia desde "Mis Pedidos".</p>
                            <Button onClick={() => { setActiveOrder(null); setCurrentView('shopping'); }} className="mt-6 w-full md:w-auto !bg-purple-600 !text-white hover:!bg-purple-700">Volver a Restaurantes</Button>
                        </div>
                    )}
                    </>
                )}
            </Card>
        );
    };

    const renderProfile = () => (
        <div className="container mx-auto p-4 md:p-8 animate-fade-in">
             <Button onClick={() => setCurrentView('shopping')} variant="secondary" className="mb-6 flex items-center">
                <ChevronLeft className="w-5 h-5 mr-2" />
                Volver a Restaurantes
            </Button>
            <h2 className="text-3xl font-bold mb-6">Mi Perfil</h2>
            <Card className="p-8 bg-white/10 border border-white/20 max-w-2xl mx-auto">
                <div className="space-y-6">
                    <div>
                        <label htmlFor="name" className="text-sm font-semibold mb-1 block text-gray-300">Nombre Completo</label>
                        <input type="text" id="name" name="name" value={profileForm.name} onChange={handleProfileFormChange} className="w-full p-2 bg-transparent border-b-2 border-white/20 focus:outline-none focus:border-purple-400 text-lg" />
                    </div>
                    <div>
                        <label htmlFor="phone" className="text-sm font-semibold mb-1 block text-gray-300">Teléfono</label>
                        <input type="tel" id="phone" name="phone" value={profileForm.phone} onChange={handleProfileFormChange} className="w-full p-2 bg-transparent border-b-2 border-white/20 focus:outline-none focus:border-purple-400 text-lg" />
                    </div>
                    <div>
                        <label htmlFor="address" className="text-sm font-semibold mb-1 block text-gray-300">Domicilio Principal</label>
                        <input type="text" id="address" name="address" value={profileForm.address} onChange={handleProfileFormChange} className="w-full p-2 bg-transparent border-b-2 border-white/20 focus:outline-none focus:border-purple-400 text-lg" />
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={isSaving} className="text-lg !bg-purple-600 hover:!bg-purple-700 flex items-center gap-2">
                        {isSaving ? <Loader className="animate-spin" size={20}/> : <Save size={20}/>}
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </Card>
        </div>
    );

    const renderContent = () => {
        switch (currentView) {
            case 'tracking':
                return (
                    <main className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
                        <div className="lg:col-span-2">
                            <Card className="overflow-hidden h-full bg-transparent border-none p-0">
                               <OrderTrackingMap 
                                    center={activeOrder?.delivery_location || user.location!}
                                    clientLocation={activeOrder?.delivery_location}
                                    businessLocation={activeOrder?.business?.location}
                                    deliveryLocation={deliveryLocation}
                                    className="h-full min-h-[400px] w-full"
                                    quickMessages={QUICK_MESSAGES_CLIENT}
                                    onSendQuickMessage={handleSendQuickMessage}
                                    isSendingAllowed={activeOrder?.status === OrderStatus.ON_THE_WAY}
                               />
                            </Card>
                        </div>
                        <div className="lg:col-span-1">
                            {renderOrderStatus()}
                        </div>
                    </main>
                );
            case 'businessDetail':
                return selectedBusiness && <BusinessDetailPage business={selectedBusiness} onAddToCart={handleAddToCart} onGoBack={handleGoBackToList} />;
            case 'history':
                return <MyOrdersPage 
                    orders={pastOrders} 
                    onTrackOrder={handleTrackOrderFromHistory} 
                    onBackToShopping={() => setCurrentView('shopping')}
                    onUpdateBusinessRating={handleBusinessRatingUpdate}
                    onUpdateOrder={handleUpdateOrder}
                />;
            case 'profile':
                return renderProfile();
            case 'shopping':
            default:
                 return (
                    <div className="container mx-auto p-4 md:p-8">
                        <div className="relative mb-4 max-w-2xl mx-auto">
                            <input type="text" placeholder="Buscar por restaurante o categoría..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full p-4 pl-12 border-none rounded-lg bg-white/20 text-white placeholder-gray-300 text-lg focus:ring-2 focus:ring-purple-400 focus:outline-none"/>
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-300" />
                        </div>
                         <BusinessFilters
                            businesses={businesses}
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClearFilters={handleClearFilters}
                        />
                        <main>
                            <h2 className="text-3xl font-bold mb-6">Restaurantes</h2>
                             {loading ? (
                                <p>Cargando negocios...</p>
                            ) : filteredBusinesses.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                    {filteredBusinesses.map(business => (
                                        <BusinessCard key={business.id} business={business} onClick={() => handleSelectBusiness(business)} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <Frown className="mx-auto h-16 w-16 text-gray-400" />
                                    <h3 className="mt-4 text-2xl font-semibold">No se encontraron resultados</h3>
                                    <p className="mt-2 text-gray-500">Intenta con una búsqueda o filtro diferente.</p>
                                </div>
                            )}
                        </main>
                     </div>
                );
        }
    }
    
    const getTitle = () => {
        switch(currentView) {
            case 'tracking': return 'Seguimiento de Pedido';
            case 'history': return 'Mis Pedidos';
            case 'profile': return 'Mi Perfil';
            case 'businessDetail': return selectedBusiness?.name || APP_NAME;
            case 'shopping':
            default: return APP_NAME;
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#1A0129]">
             <DashboardHeader 
                userName={clientProfile.name} 
                onLogout={onLogout} 
                cartItemCount={cart.length} 
                onCartClick={() => setIsCartVisible(true)} 
                onHistoryClick={() => setCurrentView('history')}
                onProfileClick={() => setCurrentView('profile')}
                title={getTitle()}
             />
             <ConfirmationModal
                isOpen={isClearCartModalVisible}
                onClose={() => {
                    setIsClearCartModalVisible(false);
                    setProductToAdd(null);
                }}
                onConfirm={handleConfirmClearCart}
                title="Limpiar Carrito"
                message="Tu carrito contiene productos de otro negocio. ¿Deseas limpiarlo para agregar este producto?"
                confirmText="Sí, limpiar"
                cancelText="Cancelar"
             />
             <ShoppingCart 
                isOpen={isCartVisible} 
                onClose={() => setIsCartVisible(false)}
                cart={cart}
                business={cartBusiness}
                userLocation={user.location || MOCK_USER_LOCATION}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onPlaceOrder={handlePlaceOrder}
             />
             {renderContent()}
        </div>
    );
};

export default ClientDashboard;