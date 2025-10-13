import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, PaymentMethod } from '../../types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { ORDER_STATUS_MAP } from '../../constants';
import { Clock, Check, X, User, Utensils, Bike } from 'lucide-react';

interface BusinessOrderCardProps {
    order: Order;
    onUpdateStatus: (orderId: string, status: OrderStatus, details?: { prepTime?: number; deliveryFee?: number }) => void;
    onViewDetails: (order: Order) => void;
}


// A custom modal for this specific use case, to avoid modifying ConfirmationModal
const AcceptOrderModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (details: { prepTime: number; deliveryFee: number }) => void;
    order: Order;
}> = ({ isOpen, onClose, onConfirm, order }) => {
    const [prepTime, setPrepTime] = useState(20);
    const [deliveryFee, setDeliveryFee] = useState(order.delivery_fee || 0);

    useEffect(() => {
        if (isOpen) {
            setPrepTime(20); // Default prep time
            setDeliveryFee(order.delivery_fee || 0); // Pre-fill with calculated fee
        }
    }, [isOpen, order]);

    const handleConfirm = () => {
        onConfirm({ prepTime, deliveryFee });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Pedido" className="!bg-[#1A0129] !text-white !border-teal-500/50 max-w-md">
            <div className="space-y-6">
                <div className='text-center'>
                    <label className="block text-gray-200 mb-2 font-semibold">Tiempo de Preparación (minutos)</label>
                    <input
                        type="number"
                        value={prepTime}
                        onChange={(e) => setPrepTime(Number(e.target.value))}
                        className="w-32 p-2 border-2 border-white/20 bg-transparent rounded-md text-center text-xl font-bold text-white focus:outline-none focus:border-teal-400"
                        min="5"
                        step="5"
                    />
                </div>
                <div className='text-center'>
                    <label className="block text-gray-200 mb-2 font-semibold">Costo de Envío ($)</label>
                    <input
                        type="number"
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(Number(e.target.value))}
                        className="w-32 p-2 border-2 border-white/20 bg-transparent rounded-md text-center text-xl font-bold text-white focus:outline-none focus:border-teal-400"
                        min="0"
                        step="0.50"
                    />
                    <p className="text-xs text-gray-400 mt-1">Modifica si es necesario. Se usará este valor.</p>
                </div>
                <div className="mt-4 border-t border-white/20 pt-4">
                    <h5 className="text-gray-200 font-semibold text-center">Detalles Adicionales</h5>
                    <div className="flex justify-between text-sm mt-2 bg-gray-800/50 p-3 rounded-lg">
                        <span className="text-gray-400">Forma de Pago:</span>
                        <span className="font-bold text-white">{order.payment_method === PaymentMethod.CASH ? 'Efectivo' : 'Transferencia'}</span>
                    </div>
                </div>
            </div>
            <div className="mt-8 flex justify-end gap-4">
                <Button onClick={onClose} variant="secondary">Cancelar</Button>
                <Button onClick={handleConfirm} className="!bg-teal-600 hover:!bg-teal-700">Confirmar Pedido</Button>
            </div>
        </Modal>
    );
};

const BusinessOrderCard: React.FC<BusinessOrderCardProps> = ({ order, onUpdateStatus, onViewDetails }) => {
    const [isAcceptModalVisible, setIsAcceptModalVisible] = useState(false);
    
    const statusInfo = ORDER_STATUS_MAP[order.status];

    const handleConfirmAccept = (details: { prepTime: number; deliveryFee: number }) => {
        onUpdateStatus(order.id, OrderStatus.IN_PREPARATION, details);
        setIsAcceptModalVisible(false);
    };

    const renderActions = () => {
        switch (order.status) {
            case OrderStatus.PENDING:
                return (
                    <div className="flex gap-2">
                        <Button onClick={() => onUpdateStatus(order.id, OrderStatus.REJECTED)} variant="danger" className="flex-1 !py-2 !text-sm">
                            <X className="w-4 h-4 mr-1" /> Rechazar
                        </Button>
                        <Button onClick={() => setIsAcceptModalVisible(true)} className="flex-1 !py-2 !text-sm !bg-teal-600 hover:!bg-teal-700">
                            <Check className="w-4 h-4 mr-1" /> Aceptar
                        </Button>
                    </div>
                );
            case OrderStatus.IN_PREPARATION:
                return (
                    <Button onClick={() => onUpdateStatus(order.id, OrderStatus.READY_FOR_PICKUP)} className="w-full !py-2 !text-sm !bg-teal-600 hover:!bg-teal-700 flex items-center justify-center">
                        <Utensils className="w-4 h-4 mr-2" /> Marcar como Listo
                    </Button>
                );
            case OrderStatus.READY_FOR_PICKUP:
                 return (
                    <div className="text-center p-2 bg-purple-900/50 rounded-md text-purple-300 text-sm font-semibold flex items-center justify-center gap-2">
                        <Bike className="w-5 h-5" /> Esperando repartidor...
                    </div>
                );
            default:
                return null; // No actions for other statuses on this card
        }
    };
    
    return (
        <>
            <Card className="p-4 bg-gray-900/50 border border-teal-500/20 flex flex-col justify-between h-full">
                <div>
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <p className="text-xs text-gray-400 flex items-center gap-1.5"><User size={14} /> {order.client?.name || 'Cliente'}</p>
                            <p className="text-xs text-gray-400">ID: #{order.id.slice(-6)}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-white text-xs font-semibold ${statusInfo.color}`}>{statusInfo.text}</span>
                    </div>
                    <ul className="space-y-1 mb-3 max-h-24 overflow-y-auto pr-2">
                        {order.items.map(item => (
                            <li key={item.product.id} className="text-sm flex justify-between">
                                <span className="truncate pr-2">{item.quantity}x {item.product.name}</span>
                                <span className="font-mono flex-shrink-0">${(item.product.price * item.quantity).toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                    {order.special_notes && (
                        <div className="mb-3 p-2 bg-yellow-900/30 border border-yellow-500/30 rounded-md">
                            <p className="text-xs font-semibold text-yellow-300">Notas del Cliente:</p>
                            <p className="text-xs text-yellow-200 italic">"{order.special_notes}"</p>
                        </div>
                    )}
                </div>
                <div className="border-t border-white/10 pt-3 mt-auto">
                    <div className="flex justify-between items-center mb-3">
                         <span className="text-sm font-semibold">Total:</span>
                         <span className="text-xl font-bold text-teal-300">${order.total_price.toFixed(2)}</span>
                    </div>
                    <div className="space-y-2">
                        {renderActions()}
                        <Button onClick={() => onViewDetails(order)} variant="secondary" className="w-full !py-2 !text-sm">
                            Ver Detalles
                        </Button>
                    </div>
                </div>
            </Card>

            <AcceptOrderModal
                isOpen={isAcceptModalVisible}
                onClose={() => setIsAcceptModalVisible(false)}
                onConfirm={handleConfirmAccept}
                order={order}
            />
        </>
    );
};

export default BusinessOrderCard;