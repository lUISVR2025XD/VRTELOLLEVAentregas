

import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ORDER_STATUS_MAP } from '../constants';
import { ChevronLeft, RefreshCw, Star, MessageSquare } from 'lucide-react';
import OrderDetailsModal from '../components/client/OrderDetailsModal';
import RatingModal from '../components/client/RatingModal';
import { orderService } from '../services/orderService';
import { businessService } from '../services/businessService';

interface MyOrdersPageProps {
    orders: Order[];
    onTrackOrder: (order: Order) => void;
    onBackToShopping: () => void;
    onUpdateBusinessRating: (businessId: string, newRating: number) => void;
    onUpdateOrder: (order: Order) => void;
}

const MyOrdersPage: React.FC<MyOrdersPageProps> = ({ orders, onTrackOrder, onBackToShopping, onUpdateBusinessRating, onUpdateOrder }) => {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    
    const isTrackable = (status: OrderStatus) => {
        return [
            OrderStatus.ACCEPTED,
            OrderStatus.IN_PREPARATION,
            OrderStatus.READY_FOR_PICKUP,
            OrderStatus.ON_THE_WAY
        ].includes(status);
    };

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailsModalOpen(true);
    };

    const handleOpenRating = (order: Order) => {
        setSelectedOrder(order);
        setIsRatingModalOpen(true);
    };
    
    const handleRatingSubmit = async (ratings: { business: number; delivery: number }) => {
        if (!selectedOrder) return;

        // In a real app, this would be a single API call.
        // Here we simulate updating the services.
        await businessService.updateBusiness(selectedOrder.business_id, { rating: ratings.business });
        onUpdateBusinessRating(selectedOrder.business_id, ratings.business);

        const updatedOrder = await orderService.updateOrder(selectedOrder.id, { is_rated: true });
        if(updatedOrder) onUpdateOrder(updatedOrder);

        setIsRatingModalOpen(false);
        setSelectedOrder(null);
    };


    return (
        <div className="container mx-auto p-4 md:p-8 animate-fade-in">
             <Button onClick={onBackToShopping} variant="secondary" className="mb-6 flex items-center">
                <ChevronLeft className="w-5 h-5 mr-2" />
                Volver a Restaurantes
            </Button>
            
            <h2 className="text-3xl font-bold mb-6">Mis Pedidos</h2>

            {orders.length > 0 ? (
                <div className="space-y-6">
                    {orders.map(order => {
                        const statusInfo = ORDER_STATUS_MAP[order.status];
                        return (
                             <Card key={order.id} className="overflow-hidden bg-white/10 border border-white/20 transition-shadow hover:shadow-lg flex flex-col sm:flex-row">
                                <div className="p-4 flex flex-col flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="text-xl font-bold">{order.business?.name}</h3>
                                            <p className="text-sm text-gray-400">
                                                {new Date(order.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${statusInfo.color}`}>{statusInfo.text}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-baseline border-t border-white/10 pt-2 mt-2">
                                        <span className="text-sm text-gray-400">ID: #{order.id.slice(-6)}</span>
                                        <span className="text-lg font-bold">Total: ${order.total_price.toFixed(2)}</span>
                                    </div>
                                    
                                    <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-2 sm:justify-end">
                                        <Button variant="secondary" onClick={() => handleViewDetails(order)} className="w-full sm:w-auto">
                                            Ver Detalles
                                        </Button>

                                        {isTrackable(order.status) && (
                                            <Button onClick={() => onTrackOrder(order)} className="w-full sm:w-auto !bg-purple-600 hover:!bg-purple-700">
                                                Seguir Pedido
                                            </Button>
                                        )}

                                        {order.status === OrderStatus.DELIVERED && !order.is_rated && (
                                            <Button onClick={() => handleOpenRating(order)} className="w-full sm:w-auto !bg-yellow-500 hover:!bg-yellow-600 text-black flex items-center justify-center">
                                                <Star className="w-4 h-4 mr-2" /> Calificar
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <p className="text-gray-400 text-center py-10">No has realizado ningún pedido todavía.</p>
            )}
            
            <OrderDetailsModal 
                isOpen={isDetailsModalOpen}
                order={selectedOrder}
                onClose={() => setIsDetailsModalOpen(false)}
            />

            <RatingModal
                isOpen={isRatingModalOpen}
                order={selectedOrder}
                onClose={() => setIsRatingModalOpen(false)}
                onSubmit={handleRatingSubmit}
            />
        </div>
    );
};

export default MyOrdersPage;