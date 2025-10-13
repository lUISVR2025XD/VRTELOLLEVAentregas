import React, { useState, useEffect, useCallback } from 'react';
import { Profile, Order, OrderStatus, Business, Product, UserRole } from '../types';
import { businessService } from '../services/businessService';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import { notificationService } from '../services/notificationService';
import DashboardHeader from '../components/shared/DashboardHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatsCard from '../components/ui/StatsCard';
import BusinessOrderCard from '../components/business/BusinessOrderCard';
import ProductFormModal from '../components/business/ProductFormModal';
import OrderDetailsModal from '../components/shared/OrderDetailsModal';
import ToggleSwitch from '../components/ui/ToggleSwitch';
import { Utensils, ClipboardList, Building, PlusCircle, Edit, Trash2, CheckCircle, Package, DollarSign, Loader, History } from 'lucide-react';
import BusinessProfile from '../components/business/BusinessProfile';
import { ORDER_STATUS_MAP } from '../constants';


type BusinessView = 'orders' | 'products' | 'profile' | 'history';

const BusinessDashboard: React.FC<{ user: Profile; onLogout: () => void }> = ({ user, onLogout }) => {
    const [currentView, setCurrentView] = useState<BusinessView>('orders');
    const [business, setBusiness] = useState<Business | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [businessData, ordersData, productsData] = await Promise.all([
                businessService.getBusinessById(user.id),
                orderService.getOrders({ businessId: user.id }),
                productService.getProductsByBusinessId(user.id)
            ]);
            setBusiness(businessData || null);
            setOrders(ordersData);
            setProducts(productsData);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    useEffect(() => {
        const handleNotification = (notification: any) => {
            if (notification.type === 'new_order' && notification.order?.business_id === user.id) {
                fetchAllData(); // Simple refetch on new order
            }
        };

        const unsubscribe = notificationService.subscribe(handleNotification);
        return () => unsubscribe();
    }, [user.id, fetchAllData]);
    
    const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus, details?: { prepTime?: number; deliveryFee?: number }) => {
        const updates: Partial<Order> = { status };
        if (details?.prepTime !== undefined) {
            updates.preparation_time = details.prepTime;
        }
        if (details?.deliveryFee !== undefined) {
            updates.delivery_fee = details.deliveryFee;
        }

        const updatedOrder = await orderService.updateOrder(orderId, updates);
        if (updatedOrder) {
            setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));

            if (status === OrderStatus.IN_PREPARATION) {
                notificationService.sendNotification({
                    id: `note-accepted-${Date.now()}`, role: UserRole.CLIENT, orderId, order: updatedOrder,
                    title: '¡Tu pedido fue aceptado!', message: `${business?.name} está preparando tu pedido. Estará listo en ~${details?.prepTime} min.`, type: 'success', icon: CheckCircle
                });
            } else if (status === OrderStatus.READY_FOR_PICKUP) {
                 notificationService.sendNotification({
                    id: `note-ready-${Date.now()}`, role: UserRole.DELIVERY, orderId, type: 'info',
                    title: 'Nuevo Pedido para Recoger', message: `El pedido de ${business?.name} está listo para ser recogido.`, icon: Package
                });
                 notificationService.sendNotification({
                    id: `note-ready-client-${Date.now()}`, role: UserRole.CLIENT, orderId, order: updatedOrder, type: 'info',
                    title: 'Pedido Listo para Recoger', message: `Tu pedido de ${business?.name} está listo. Esperando repartidor.`, icon: Package
                });
            }
        }
    };
    
    const handleSaveProduct = async (productData: Omit<Product, 'id' | 'image'> & { image: File | string }, productId?: string) => {
        // In a real app, you would upload the image file and get a URL.
        // For this mock, we'll just use the preview URL or existing URL.
        const finalImageURL = typeof productData.image === 'string' ? productData.image : URL.createObjectURL(productData.image);

        const dataToSave: Omit<Product, 'id'> = {
            ...productData,
            image: finalImageURL,
        };

        if (productId) {
            await productService.updateProduct(productId, dataToSave);
        } else {
            await productService.addProduct(dataToSave);
        }
        await fetchAllData(); // Refresh products list
        setIsProductModalOpen(false);
        setProductToEdit(null);
    };

    const handleDeleteProduct = async (productId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            await productService.deleteProduct(productId);
            await fetchAllData(); // Refresh products list
        }
    };
    
     const handleToggleOpen = async (isOpen: boolean) => {
        if (business) {
            const updatedBusiness = await businessService.updateBusiness(business.id, { is_open: isOpen });
            setBusiness(updatedBusiness);
        }
    };


    const renderOrders = () => {
        const activeOrders = orders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.REJECTED);
        return (
            <div>
                <h2 className="text-3xl font-bold mb-6 text-teal-300">Pedidos Activos</h2>
                {activeOrders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {activeOrders.map(order => (
                            <BusinessOrderCard key={order.id} order={order} onUpdateStatus={handleUpdateOrderStatus} onViewDetails={(o) => { setSelectedOrder(o); setIsDetailsModalOpen(true); }}/>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-center py-10">No hay pedidos activos en este momento.</p>
                )}
            </div>
        );
    };
    
    const renderProducts = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-teal-300">Mi Menú</h2>
                <Button onClick={() => { setProductToEdit(null); setIsProductModalOpen(true); }} className="flex items-center gap-2 !bg-teal-600 hover:!bg-teal-700">
                    <PlusCircle size={20} /> Agregar Producto
                </Button>
            </div>
            <div className="bg-gray-900/50 border border-teal-500/20 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-800/60">
                        <tr>
                            <th className="p-4">Producto</th>
                            <th className="p-4">Categoría</th>
                            <th className="p-4">Precio</th>
                            <th className="p-4">Disponibilidad</th>
                            <th className="p-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id} className="border-b border-white/10 last:border-b-0">
                                <td className="p-4 flex items-center gap-3">
                                    <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded-md"/>
                                    <span className="font-semibold">{product.name}</span>
                                </td>
                                <td className="p-4">{product.category}</td>
                                <td className="p-4 font-mono">${product.price.toFixed(2)}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs rounded-full ${product.is_available ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                        {product.is_available ? 'Disponible' : 'Agotado'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        <Button variant="secondary" className="!p-2" onClick={() => { setProductToEdit(product); setIsProductModalOpen(true); }}><Edit size={16}/></Button>
                                        <Button variant="danger" className="!p-2" onClick={() => handleDeleteProduct(product.id)}><Trash2 size={16}/></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
    
    const renderHistory = () => {
        const historicalOrders = orders.filter(o => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED || o.status === OrderStatus.REJECTED);
        return (
            <div>
                <h2 className="text-3xl font-bold mb-6 text-teal-300">Historial de Pedidos</h2>
                {historicalOrders.length > 0 ? (
                    <div className="space-y-4">
                        {historicalOrders.map(order => (
                            <Card key={order.id} className="p-4 bg-gray-900/50 border border-teal-500/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex-grow">
                                    <p className="font-semibold">Pedido de {order.client?.name}</p>
                                    <p className="text-sm text-gray-400">ID: #{order.id.slice(-6)}</p>
                                    <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString('es-MX')}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="font-bold text-lg text-teal-300">${order.total_price.toFixed(2)}</p>
                                    <span className={`px-2 py-0.5 rounded-full text-white text-xs ${ORDER_STATUS_MAP[order.status].color}`}>{ORDER_STATUS_MAP[order.status].text}</span>
                                </div>
                                <div className="w-full sm:w-auto flex-shrink-0">
                                    <Button variant="secondary" onClick={() => { setSelectedOrder(order); setIsDetailsModalOpen(true); }} className="w-full sm:w-auto">Ver Detalles</Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-center py-10">No hay pedidos en el historial.</p>
                )}
            </div>
        );
    };

    const renderContent = () => {
        if (isLoading) {
            return <div className="text-center p-8"><Loader className="animate-spin inline-block" /> Cargando...</div>;
        }
        if (!business) {
             return <div className="text-center p-8 text-red-400">Error al cargar la información del negocio.</div>
        }
        if (business.approvalStatus !== 'approved') {
            return (
                <Card className="p-8 text-center bg-gray-900/50 border border-yellow-500/30">
                    <h2 className="text-3xl font-bold text-yellow-300">Cuenta en Revisión</h2>
                    <p className="mt-4 text-lg text-gray-300">
                        {business.approvalStatus === 'pending'
                            ? "Tu solicitud de registro está siendo revisada por nuestro equipo. Te notificaremos cuando sea aprobada."
                            : "Tu solicitud de registro fue rechazada. Por favor, contacta a soporte para más información."}
                    </p>
                </Card>
            );
        }

        switch(currentView) {
            case 'orders': return renderOrders();
            case 'products': return renderProducts();
            case 'profile': return <BusinessProfile user={user} />;
            case 'history': return renderHistory();
            default: return null;
        }
    };
    
    const navItems = [
        { id: 'orders', label: 'Pedidos', icon: ClipboardList },
        { id: 'products', label: 'Menú', icon: Utensils },
        { id: 'history', label: 'Historial', icon: History },
        { id: 'profile', label: 'Perfil', icon: Building },
    ];
    
    const totalRevenue = orders.filter(o => o.status === 'DELIVERED').reduce((sum, o) => sum + o.total_price, 0);
    const pendingOrders = orders.filter(o => o.status === 'PENDING').length;

    return (
        <div className="min-h-screen flex flex-col bg-[#1A0129]">
             <DashboardHeader userName={user.name} onLogout={onLogout} title={business?.name || 'Cargando...'} />
             <main className="container mx-auto p-4 md:p-8 flex-grow">
                 {business?.approvalStatus === 'approved' && (
                     <>
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
                           <div className="flex items-center gap-4">
                             {navItems.map(item => (
                                <button key={item.id} onClick={() => setCurrentView(item.id as BusinessView)}
                                    className={`flex items-center gap-2 p-3 rounded-lg transition-colors ${currentView === item.id ? 'bg-teal-600 text-white' : 'hover:bg-white/10'}`}>
                                    <item.icon size={20} />
                                    <span className="font-semibold">{item.label}</span>
                                </button>
                             ))}
                           </div>
                           <ToggleSwitch id="open-status" checked={business?.is_open || false} onChange={handleToggleOpen} label={business?.is_open ? 'Abierto' : 'Cerrado'}/>
                        </div>
                        
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <StatsCard title="Ingresos Totales (Histórico)" value={`$${totalRevenue.toLocaleString()}`} icon={<DollarSign size={28} className="text-white"/>} iconBgColor="#00A88B" className="bg-gradient-to-br from-gray-800 to-gray-900"/>
                            <StatsCard title="Pedidos Pendientes" value={pendingOrders.toString()} icon={<ClipboardList size={28} className="text-white"/>} iconBgColor="#F2994A" className="bg-gradient-to-br from-gray-800 to-gray-900"/>
                            <StatsCard title="Total Productos" value={products.length.toString()} icon={<Utensils size={28} className="text-white"/>} iconBgColor="#9B51E0" className="bg-gradient-to-br from-gray-800 to-gray-900"/>
                        </div>
                     </>
                 )}
                 {renderContent()}
             </main>
             {business && (
                 <ProductFormModal
                    isOpen={isProductModalOpen}
                    onClose={() => { setIsProductModalOpen(false); setProductToEdit(null); }}
                    onSave={handleSaveProduct}
                    productToEdit={productToEdit}
                    businessId={business.id}
                />
             )}
             <OrderDetailsModal 
                isOpen={isDetailsModalOpen}
                order={selectedOrder}
                onClose={() => setIsDetailsModalOpen(false)}
             />
        </div>
    );
};

export default BusinessDashboard;