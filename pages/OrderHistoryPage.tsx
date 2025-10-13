import React from 'react';
import { Order, OrderStatus } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ORDER_STATUS_MAP } from '../constants';
import { ChevronLeft, RefreshCw } from 'lucide-react';

interface OrderHistoryPageProps {
    orders: Order[];
    onTrackOrder: (order: Order) => void;
    onBackToShopping: () => void;
}

const OrderHistoryPage: React.FC<OrderHistoryPageProps> = ({ orders, onTrackOrder, onBackToShopping }) => {
    
    const isTrackable = (status: OrderStatus) => {
        return [
            OrderStatus.ACCEPTED,
            OrderStatus.IN_PREPARATION,
            OrderStatus.READY_FOR_PICKUP,
            OrderStatus.ON_THE_WAY
        ].includes(status);
    };

    return (
        <div className="container mx-auto p-4 md:p-8 animate-fade-in">
             <Button onClick={onBackToShopping} variant="secondary" className="mb-6 flex items-center">
                <ChevronLeft className="w-5 h-5 mr-2" />
                Volver a Restaurantes
            </Button>
            
            <h2 className="text-3xl font-bold mb-6">Historial de Pedidos</h2>

            {orders.length > 0 ? (
                <div className="space-y-6">
                    {orders.map(order => {
                        const statusInfo = ORDER_STATUS_MAP[order.status];
                        return (
                             <Card key={order.id} className="overflow-hidden bg-white/10 border border-white/20 transition-shadow hover:shadow-lg flex flex-col sm:flex-row">
                                {order.business?.image && (
                                    <img src={order.business.image} alt={order.business.name} className="w-full sm:w-40 h-40 sm:h-auto object-cover" />
                                )}
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
                                        {isTrackable(order.status) ? (
                                            <Button onClick={() => onTrackOrder(order)} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700">
                                                Seguir Pedido
                                            </Button>
                                        ) : (
                                            <Button variant="secondary" className="w-full sm:w-auto" disabled={order.status === OrderStatus.CANCELLED}>
                                                Ver Recibo
                                            </Button>
                                        )}
                                        <Button variant="secondary" className="w-full sm:w-auto flex items-center justify-center">
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Volver a Pedir
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <p className="text-gray-400 text-center py-10">No has realizado ningún pedido todavía.</p>
            )}
        </div>
    );
};

export default OrderHistoryPage;