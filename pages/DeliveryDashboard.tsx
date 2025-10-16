import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Profile, Order, OrderStatus, DeliveryPerson, UserRole, QuickMessage, Location, Document, Business } from '../types';
import { deliveryService } from '../services/deliveryService';
import { orderService } from '../services/orderService';
import { notificationService } from '../services/notificationService';
import { compressImage } from '../utils/imageCompressor';
import DashboardHeader from '../components/shared/DashboardHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatsCard from '../components/ui/StatsCard';
import ToggleSwitch from '../components/ui/ToggleSwitch';
import OrderTrackingMap from '../components/maps/OrderTrackingMap';
import OrderDetailsModal from '../components/shared/OrderDetailsModal';
import { Bike, ClipboardList, Package, DollarSign, CheckCircle, ThumbsUp, MessageSquare, User, Upload, Trash2, Save, Loader, Phone, MapPin, FileText, Briefcase } from 'lucide-react';
import { QUICK_MESSAGES_DELIVERY, ORDER_STATUS_MAP } from '../constants';
import { businessService } from '../services/businessService';

type DeliveryView = 'available' | 'active' | 'history' | 'profile';
type DocumentFile = { file?: File; preview: string; name: string; type: 'image' | 'pdf'; url?: string };

interface DeliveryDashboardProps {
  user: Profile;
  onLogout: () => void;
}

const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({ user, onLogout }) => {
    const [currentView, setCurrentView] = useState<DeliveryView>('available');
    const [deliveryPerson, setDeliveryPerson] = useState<DeliveryPerson | null>(null);
    const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [pastOrders, setPastOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [deliveryPosition, setDeliveryPosition] = useState<Location | undefined>(undefined);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [businesses, setBusinesses] = useState<Business[]>([]);

    // Profile form state
    const [profileForm, setProfileForm] = useState({ name: '', phone: '', address: '', vehicle: '' });
    const [profileImage, setProfileImage] = useState<{ file: File | null; preview: string | null }>({ file: null, preview: null });
    const [documents, setDocuments] = useState<DocumentFile[]>([]);


    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [personData, allOrders, businessesData] = await Promise.all([
                deliveryService.getAllDeliveryPeople().then(people => people.find(p => p.id === user.id)),
                orderService.getOrders({}),
                businessService.getAllBusinesses()
            ]);
            
            setDeliveryPerson(personData || null);
            setBusinesses(businessesData);
            if (personData) {
                setProfileForm({
                    name: personData.name,
                    phone: personData.phone,
                    address: personData.address || '',
                    vehicle: personData.vehicle
                });
                setProfileImage({ file: null, preview: personData.image || null });
                 if (personData.documents) {
                    setDocuments(personData.documents.map(doc => ({
                        preview: doc.url, name: doc.name, type: doc.type, url: doc.url,
                    })));
                }
            }


            const myActiveOrder = allOrders.find(o => o.delivery_person_id === user.id && o.status === OrderStatus.ON_THE_WAY);
            setActiveOrder(myActiveOrder || null);
            if (myActiveOrder) {
                setDeliveryPosition(personData?.location || myActiveOrder.business?.location);
                setCurrentView('active');
            } else {
                 setCurrentView('available');
            }

            const readyOrders = allOrders.filter(o => o.status === OrderStatus.READY_FOR_PICKUP && !o.delivery_person_id);
            setAvailableOrders(readyOrders);
            
            const myPastOrders = allOrders.filter(o => o.delivery_person_id === user.id && (o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED));
            setPastOrders(myPastOrders);

        } catch (error) {
            console.error("Failed to fetch delivery dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    useEffect(() => {
        const handleNotification = (notification: any) => {
            if (notification.role === UserRole.DELIVERY) {
                fetchAllData();
            }
        };
        const unsubscribe = notificationService.subscribe(handleNotification);
        return () => unsubscribe();
    }, [fetchAllData]);

    useEffect(() => {
        let intervalId: number | undefined;
        if (currentView === 'active' && activeOrder) {
            intervalId = window.setInterval(() => {
                setDeliveryPosition(prev => {
                    if (!prev || !activeOrder?.delivery_location) return prev;
                    const dest = activeOrder.delivery_location;
                    const dist = Math.sqrt(Math.pow(dest.lat - prev.lat, 2) + Math.pow(dest.lng - prev.lng, 2));
                    if (dist < 0.0001) {
                        clearInterval(intervalId);
                        return dest;
                    }
                    const newLat = prev.lat + (dest.lat - prev.lat) * 0.1;
                    const newLng = prev.lng + (dest.lng - prev.lng) * 0.1;
                    return { lat: newLat, lng: newLng };
                });
            }, 2000);
        }
        return () => clearInterval(intervalId);
    }, [activeOrder, currentView]);

    // FIX: Moved useMemo from the renderProfile function to the top level.
    // This ensures hooks are always called in the same order, fixing a conditional hook error.
    const affiliatedBusinessName = useMemo(() => {
        if (!deliveryPerson?.adscrito_al_negocio_id) return 'Independiente';
        return businesses.find(b => b.id === deliveryPerson.adscrito_al_negocio_id)?.name || 'Negocio no encontrado';
    }, [deliveryPerson, businesses]);

    const handleToggleOnline = async (isOnline: boolean) => {
        if (deliveryPerson) {
            const updatedPerson = await deliveryService.updateDeliveryPerson(deliveryPerson.id, { is_online: isOnline });
            setDeliveryPerson(updatedPerson);
        }
    };
    
    const handleAcceptOrder = async (order: Order) => {
        if (!deliveryPerson) return;
        
        const updatedOrder = await orderService.updateOrder(order.id, {
            status: OrderStatus.ON_THE_WAY,
            delivery_person_id: deliveryPerson.id,
            delivery_person: deliveryPerson
        });
        
        if (updatedOrder) {
            notificationService.sendNotification({
                id: `note-pickup-${Date.now()}`, role: UserRole.CLIENT, orderId: order.id, order: updatedOrder,
                title: '¡Tu repartidor está en camino!',
                message: `${deliveryPerson.name} ha recogido tu pedido y va en camino.`,
                type: 'info', icon: Bike
            });
            fetchAllData();
        }
    };

    const handleDeliverOrder = async () => {
        if (!activeOrder) return;
        const updatedOrder = await orderService.updateOrder(activeOrder.id, { status: OrderStatus.DELIVERED });
        if (updatedOrder) {
            notificationService.sendNotification({
                id: `note-delivered-${Date.now()}`, role: UserRole.CLIENT, orderId: updatedOrder.id, order: updatedOrder,
                title: '¡Pedido Entregado!',
                message: `Tu pedido de ${activeOrder.business?.name} ha sido entregado. ¡Buen provecho!`,
                type: 'success', icon: CheckCircle
            });
            fetchAllData();
        }
    };

    const handleSendQuickMessage = async (message: string) => {
        if (!activeOrder) return;
        const quickMessage: QuickMessage = {
            id: `msg-${Date.now()}`,
            order_id: activeOrder.id,
            sender_id: user.id,
            recipient_id: activeOrder.client_id,
            message: message,
            created_at: new Date().toISOString(),
            is_read: false,
        };
        const updatedOrder = await orderService.addMessageToOrder(activeOrder.id, quickMessage);
        if (updatedOrder) {
            setActiveOrder(updatedOrder);
            notificationService.sendNotification({
                id: `note-msg-del-${Date.now()}`,
                role: UserRole.CLIENT, orderId: activeOrder.id, order: updatedOrder,
                title: 'Mensaje del Repartidor',
                message: `Repartidor para pedido #${activeOrder.id.slice(-6)}: "${message}"`,
                type: 'info', icon: MessageSquare
            });
        }
    };

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailsModalOpen(true);
    };
    
    // --- Profile Section Handlers ---
    const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileForm(prev => ({ ...prev, [name]: value }));
    };

    const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressedFile = await compressImage(file, 250);
                setProfileImage({ file: compressedFile, preview: URL.createObjectURL(compressedFile) });
            } catch (error) {
                console.error("Image compression failed:", error);
            }
        }
    };

    const handleDocumentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        for (const file of Array.from(files) as File[]) {
            if (documents.some(d => d.name === file.name)) continue;
            if (file.type.startsWith('image/')) {
                const compressedFile = await compressImage(file, 250);
                const newDoc: DocumentFile = { file: compressedFile, preview: URL.createObjectURL(compressedFile), name: compressedFile.name, type: 'image' };
                setDocuments(prev => [...prev, newDoc]);
            } else if (file.type === 'application/pdf') {
                 if (file.size > 500 * 1024) { alert(`PDF "${file.name}" is too large.`); continue; }
                const newDoc: DocumentFile = { file, preview: '', name: file.name, type: 'pdf' };
                setDocuments(prev => [...prev, newDoc]);
            }
        }
    };

    const removeDocument = (docName: string) => {
        setDocuments(prev => prev.filter(d => d.name !== docName));
    };

    const handleSaveProfile = async () => {
        if (!deliveryPerson) return;
        setIsSaving(true);
        const updates: Partial<DeliveryPerson> = { ...profileForm };

        if (profileImage.file) {
            updates.image = profileImage.preview || '';
        }
        
        updates.documents = documents.map(doc => ({
            name: doc.name,
            url: doc.file ? URL.createObjectURL(doc.file) : doc.url || '',
            type: doc.type,
        }));

        try {
            const updatedPerson = await deliveryService.updateDeliveryPerson(deliveryPerson.id, updates);
            setDeliveryPerson(updatedPerson);
             notificationService.sendNotification({
                id: `profile-saved-${Date.now()}`, role: UserRole.DELIVERY, title: 'Perfil Guardado',
                message: 'Tu información ha sido actualizada.', type: 'success'
            });
        } catch (error) {
             notificationService.sendNotification({
                id: `profile-error-${Date.now()}`, role: UserRole.DELIVERY, title: 'Error',
                message: 'No se pudo guardar tu perfil.', type: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };


    const renderAvailableOrders = () => (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-teal-300">Pedidos Disponibles</h2>
            {deliveryPerson?.is_online ? (
                availableOrders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableOrders.map(order => (
                            <Card key={order.id} className="p-4 bg-gray-900/50 border border-teal-500/20 flex flex-col justify-between">
                                 <div>
                                    <h3 className="font-bold text-lg">{order.business?.name}</h3>
                                    <p className="text-sm text-gray-400">{order.business?.address}</p>
                                    <p className="text-sm mt-2"><span className="font-semibold">Destino:</span> {order.delivery_address}</p>
                                    <p className="font-bold text-teal-400 mt-2">Envío: ${order.delivery_fee.toFixed(2)}</p>
                                 </div>
                                 <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-2">
                                     <Button onClick={() => handleViewDetails(order)} variant="secondary" className="flex-1">Ver Detalles</Button>
                                     <Button onClick={() => handleAcceptOrder(order)} className="flex-1 !bg-teal-600 hover:!bg-teal-700">Aceptar Entrega</Button>
                                 </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-center py-10">No hay pedidos disponibles. Conéctate para recibir notificaciones.</p>
                )
            ) : (
                 <p className="text-yellow-400 text-center py-10 bg-yellow-900/20 rounded-lg">Estás desconectado. Activa tu estado para ver y aceptar pedidos.</p>
            )}
        </div>
    );
    
    const renderActiveDelivery = () => {
        if (!activeOrder) return <div className="text-center p-8">No tienes una entrega activa.</div>;
        const statusInfo = ORDER_STATUS_MAP[activeOrder.status];
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card className="overflow-hidden h-full bg-transparent border-none p-0">
                       <OrderTrackingMap 
                            center={activeOrder.delivery_location}
                            clientLocation={activeOrder.delivery_location}
                            businessLocation={activeOrder.business?.location}
                            deliveryLocation={deliveryPosition}
                            className="h-full min-h-[400px] lg:min-h-[600px] w-full"
                            quickMessages={QUICK_MESSAGES_DELIVERY}
                            onSendQuickMessage={handleSendQuickMessage}
                            isSendingAllowed={true}
                       />
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card className="p-6 bg-gray-900/50 border border-teal-500/20">
                        <div className="flex justify-between items-start mb-4">
                             <div>
                                <h3 className="text-2xl font-bold">Entrega Activa</h3>
                                <p className="text-gray-400">ID: #{activeOrder.id.slice(-6)}</p>
                             </div>
                             <div className={`px-4 py-2 rounded-full text-white font-semibold text-sm ${statusInfo.color}`}>{statusInfo.text}</div>
                        </div>
                        <div className="space-y-4">
                            <div><h4 className="font-semibold text-teal-300">Recoger en:</h4><p>{activeOrder.business?.name}</p><p className="text-sm text-gray-400">{activeOrder.business?.address}</p></div>
                             <div><h4 className="font-semibold text-teal-300">Entregar a:</h4><p>{activeOrder.client?.name}</p><p className="text-sm text-gray-400">{activeOrder.delivery_address}</p></div>
                        </div>
                        <div className="mt-6 border-t border-white/10 pt-4"><Button onClick={handleDeliverOrder} className="w-full text-lg !bg-teal-600 hover:!bg-teal-700">Marcar como Entregado</Button></div>
                    </Card>
                </div>
            </div>
        );
    };

    const renderHistory = () => (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-teal-300">Historial de Entregas</h2>
            {pastOrders.length > 0 ? (
                <div className="space-y-4">
                    {pastOrders.map(order => (
                        <Card key={order.id} className="p-4 bg-gray-900/50 border border-teal-500/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex-grow">
                                <p className="font-semibold">Pedido a {order.business?.name}</p>
                                <p className="text-sm text-gray-400">Cliente: {order.client?.name}</p>
                                <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString('es-MX')}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="font-bold text-lg text-teal-300">${order.total_price.toFixed(2)}</p>
                                <span className={`px-2 py-0.5 rounded-full text-white text-xs ${ORDER_STATUS_MAP[order.status].color}`}>{ORDER_STATUS_MAP[order.status].text}</span>
                            </div>
                            <div className="w-full sm:w-auto flex-shrink-0">
                                 <Button variant="secondary" onClick={() => handleViewDetails(order)} className="w-full sm:w-auto">Ver Detalles</Button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : <p className="text-gray-400 text-center py-10">No has completado ninguna entrega.</p>}
        </div>
    );
    
    const renderProfile = () => {
        return (
            <div className="space-y-8">
                <h2 className="text-3xl font-bold text-teal-300">Mi Perfil</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="p-6 bg-gray-900/50 border border-teal-500/20 text-center">
                            <h3 className="text-xl font-bold mb-4 text-teal-300">Fotografía de Perfil</h3>
                            <img 
                                src={profileImage.preview || `https://ui-avatars.com/api/?name=${profileForm.name.replace(' ','+')}&background=1A0129&color=fff&size=160`} 
                                alt="Foto de perfil" 
                                className="w-40 h-40 object-cover rounded-full mx-auto mb-4 bg-gray-700 border-4 border-teal-500/50"
                            />
                            <input type="file" id="profileImage" className="hidden" accept="image/*" onChange={handleProfileImageChange} />
                            <Button as="label" htmlFor="profileImage" className="w-full justify-center flex items-center gap-2">
                                <Upload size={18}/> Cambiar Foto
                            </Button>
                        </Card>
                    </div>

                    <div className="lg:col-span-2">
                        <Card className="p-6 bg-gray-900/50 border border-teal-500/20">
                            <h3 className="text-xl font-bold mb-6 text-teal-300">Información Personal y Vehículo</h3>
                            <div className="space-y-6">
                               <div className="flex items-center gap-4">
                                   <Briefcase className="w-6 h-6 text-teal-400 flex-shrink-0"/>
                                   <div className="flex-grow">
                                       <label className="text-sm text-gray-400">Adscrito al Negocio</label>
                                       <p className="w-full bg-transparent text-lg text-gray-300 pt-1">{affiliatedBusinessName}</p>
                                       <p className="text-xs text-gray-500">Este campo solo puede ser modificado por un administrador.</p>
                                   </div>
                               </div>
                               <div className="flex items-center gap-4">
                                    <User className="w-6 h-6 text-teal-400 flex-shrink-0"/>
                                    <div className="flex-grow">
                                        <label className="text-sm text-gray-400">Nombre Completo</label>
                                        <input name="name" type="text" value={profileForm.name} onChange={handleProfileInputChange} className="w-full bg-transparent border-b-2 border-white/20 focus:outline-none focus:border-teal-400 text-lg"/>
                                    </div>
                               </div>
                                <div className="flex items-center gap-4">
                                    <Phone className="w-6 h-6 text-teal-400 flex-shrink-0"/>
                                    <div className="flex-grow">
                                        <label className="text-sm text-gray-400">Teléfono</label>
                                        <input name="phone" type="tel" value={profileForm.phone} onChange={handleProfileInputChange} className="w-full bg-transparent border-b-2 border-white/20 focus:outline-none focus:border-teal-400 text-lg"/>
                                    </div>
                               </div>
                                <div className="flex items-center gap-4">
                                    <MapPin className="w-6 h-6 text-teal-400 flex-shrink-0"/>
                                    <div className="flex-grow">
                                        <label className="text-sm text-gray-400">Domicilio</label>
                                        <input name="address" type="text" value={profileForm.address} onChange={handleProfileInputChange} className="w-full bg-transparent border-b-2 border-white/20 focus:outline-none focus:border-teal-400 text-lg"/>
                                    </div>
                               </div>
                                <div className="flex items-center gap-4">
                                    <Bike className="w-6 h-6 text-teal-400 flex-shrink-0"/>
                                    <div className="flex-grow">
                                        <label className="text-sm text-gray-400">Vehículo</label>
                                        <input name="vehicle" type="text" value={profileForm.vehicle} onChange={handleProfileInputChange} className="w-full bg-transparent border-b-2 border-white/20 focus:outline-none focus:border-teal-400 text-lg"/>
                                    </div>
                               </div>
                            </div>
                        </Card>
                    </div>
                </div>

                <Card className="p-6 bg-gray-900/50 border border-teal-500/20">
                    <h3 className="text-xl font-bold mb-2 text-teal-300">Documentos</h3>
                    <p className="text-sm text-gray-400 mb-4">Sube tu licencia, tarjeta de circulación, etc. (Imágenes o PDF).</p>
                    <input type="file" id="documents" className="hidden" accept="image/*,.pdf" multiple onChange={handleDocumentChange} />
                    <Button as="label" htmlFor="documents" className="w-full md:w-auto justify-center flex items-center gap-2">
                        <Upload size={18}/> Cargar Documentos
                    </Button>
                    
                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {documents.map(doc => (
                            <div key={doc.name} className="relative group border-2 border-white/10 rounded-lg p-2">
                               {doc.type === 'image' ? (
                                    <img src={doc.preview} alt={doc.name} className="w-full h-32 object-contain rounded-md"/>
                               ) : (
                                   <div className="w-full h-32 bg-gray-800 rounded-md flex flex-col items-center justify-center p-2">
                                        <FileText className="w-10 h-10 text-red-400 mb-2"/>
                                   </div>
                               )}
                                <p className="text-xs text-center break-words mt-2 text-gray-300">{doc.name}</p>
                               <button onClick={() => removeDocument(doc.name)} className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={14}/>
                               </button>
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="flex justify-end mt-8">
                    <Button onClick={handleSaveProfile} disabled={isSaving} className="text-lg !bg-teal-600 hover:!bg-teal-700 flex items-center gap-2">
                        {isSaving ? <Loader className="animate-spin" size={20}/> : <Save size={20}/>}
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </div>
        );
    };


    const renderContent = () => {
        // Always allow rendering profile, even with an active order
        if (currentView === 'profile') {
            return renderProfile();
        }
        if (activeOrder) {
            return renderActiveDelivery();
        }
        switch(currentView){
            case 'available': return renderAvailableOrders();
            case 'history': return renderHistory();
            default: return renderAvailableOrders();
        }
    }
    
    if (isLoading) return <div className="min-h-screen bg-[#1A0129] flex items-center justify-center text-white">Cargando...</div>;
    
    if (!deliveryPerson) {
        return <div className="min-h-screen bg-[#1A0129] flex items-center justify-center text-red-400">Error al cargar datos del repartidor.</div>
    }

    if (deliveryPerson.approvalStatus !== 'approved') {
         return (
             <div className="min-h-screen bg-[#1A0129] flex flex-col">
                <DashboardHeader userName={user.name} onLogout={onLogout} title="Panel de Repartidor" />
                <main className="container mx-auto p-4 md:p-8 flex-grow flex items-center justify-center">
                    <Card className="p-8 text-center bg-gray-900/50 border border-yellow-500/30">
                        <h2 className="text-3xl font-bold text-yellow-300">Cuenta en Revisión</h2>
                        <p className="mt-4 text-lg text-gray-300">
                            {deliveryPerson.approvalStatus === 'pending' ? "Tu solicitud está siendo revisada." : "Tu solicitud fue rechazada."}
                        </p>
                    </Card>
                </main>
             </div>
        );
    }
    
    const navItems = [
        { id: 'available', label: 'Disponibles', icon: Package },
        { id: 'history', label: 'Historial', icon: ClipboardList },
        { id: 'profile', label: 'Perfil', icon: User },
    ];
    
    return (
        <div className="min-h-screen flex flex-col bg-[#1A0129]">
            <DashboardHeader userName={user.name} onLogout={onLogout} title="Panel de Repartidor" />
            <main className="container mx-auto p-4 md:p-8 flex-grow">
                 <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
                     <div className="flex items-center gap-4">
                         {navItems.map(item => (
                            <button key={item.id}
                                onClick={() => setCurrentView(item.id as DeliveryView)}
                                disabled={!!activeOrder && item.id !== 'profile'}
                                className={`flex items-center gap-2 p-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${currentView === item.id ? 'bg-teal-600 text-white' : 'hover:bg-white/10'}`}>
                                <item.icon size={20} />
                                <span className="font-semibold">{item.label}</span>
                            </button>
                         ))}
                         {activeOrder && currentView !== 'profile' && (
                            <div className='flex items-center gap-2 p-3 rounded-lg bg-purple-800 text-white'>
                                <Bike size={20}/>
                                <span className="font-semibold">Entrega Activa</span>
                            </div>
                         )}
                     </div>
                     <ToggleSwitch id="online-status" checked={deliveryPerson?.is_online || false} onChange={handleToggleOnline} label={deliveryPerson?.is_online ? 'En Línea' : 'Desconectado'}/>
                 </div>
                 
                 {currentView !== 'profile' && !activeOrder && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <StatsCard title="Ganancias (Histórico)" value={`$${pastOrders.reduce((sum, o) => sum + (o.total_price * 0.1), 0).toFixed(2)}`} icon={<DollarSign size={28} className="text-white"/>} iconBgColor="#00A88B" className="bg-gradient-to-br from-gray-800 to-gray-900"/>
                        <StatsCard title="Entregas Totales" value={pastOrders.length.toString()} icon={<Bike size={28} className="text-white"/>} iconBgColor="#3F7FBF" className="bg-gradient-to-br from-gray-800 to-gray-900"/>
                        <StatsCard title="Rating" value={deliveryPerson?.rating.toString() || 'N/A'} icon={<ThumbsUp size={28} className="text-white"/>} iconBgColor="#9B51E0" className="bg-gradient-to-br from-gray-800 to-gray-900"/>
                    </div>
                 )}
                 
                 {renderContent()}
            </main>
            <OrderDetailsModal
                isOpen={isDetailsModalOpen}
                order={selectedOrder}
                onClose={() => setIsDetailsModalOpen(false)}
            />
        </div>
    );
};

export default DeliveryDashboard;