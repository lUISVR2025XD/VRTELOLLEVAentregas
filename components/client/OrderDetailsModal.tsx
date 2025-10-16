import React from 'react';
import { Order } from '../../types';
import Modal from '../ui/Modal';
import { ORDER_STATUS_MAP } from '../../constants';
import { MapPin, FileText, ShoppingBag, Bike, CreditCard } from 'lucide-react';

interface OrderDetailsModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, order, onClose }) => {
  if (!isOpen || !order) return null;

  const statusInfo = ORDER_STATUS_MAP[order.status];
  const subtotal = order.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const paymentMethodText = order.payment_method === 'CASH' ? 'Efectivo' : 'Transferencia';

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={`Detalles del Pedido #${order.id.slice(-6)}`} 
        className="!bg-[#2C0054] !text-white max-w-2xl border-2 border-purple-800"
    >
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white/5 rounded-lg border border-white/20">
                <div>
                    <p className="text-sm text-gray-400">Pedido a</p>
                    <h3 className="text-2xl font-bold text-white">{order.business?.name}</h3>
                    <p className="text-sm text-gray-300">
                        {new Date(order.created_at).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}
                    </p>
                </div>
                <div className={`mt-2 sm:mt-0 px-4 py-2 rounded-full text-white font-semibold text-sm ${statusInfo.color}`}>
                    {statusInfo.text}
                </div>
            </div>

            <div>
                <h4 className="font-bold text-lg mb-2 flex items-center"><ShoppingBag className="w-5 h-5 mr-2 text-purple-400"/> Resumen del Pedido</h4>
                <ul className="divide-y divide-white/10 border-y border-white/10">
                    {order.items.map(item => (
                        <li key={item.product.id} className="py-2 text-sm">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="font-semibold text-white">{item.quantity}x</span>
                                    <span className="text-gray-300 ml-2">{item.product.name}</span>
                                </div>
                                <span className="text-gray-200">${(item.product.price * item.quantity).toFixed(2)}</span>
                            </div>
                            {item.pizza_configuration && (
                                <p className="text-xs text-purple-300 pl-6 italic mt-1">
                                    ↳ {item.pizza_configuration}
                                </p>
                            )}
                        </li>
                    ))}
                </ul>
                <div className="space-y-1 text-sm pt-3">
                    <div className="flex justify-between text-gray-300"><span>Subtotal:</span> <span>${subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-gray-300"><span>Envío:</span> <span>${(order.delivery_fee || 0).toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-base mt-1 text-white"><span>Total:</span> <span>${order.total_price.toFixed(2)}</span></div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-lg border border-white/20">
                    <h4 className="font-bold text-lg mb-2 flex items-center"><MapPin className="w-5 h-5 mr-2 text-purple-400"/> Información de Entrega</h4>
                    <p className="text-sm text-gray-300">{order.delivery_address}</p>
                    {order.delivery_person && (
                         <div className="mt-3 pt-3 border-t border-white/10 flex items-center">
                            <Bike className="w-5 h-5 mr-2 text-purple-400"/>
                            <div>
                                <p className="text-xs text-gray-400">Repartidor</p>
                                <p className="font-semibold text-sm text-white">{order.delivery_person.name}</p>
                            </div>
                        </div>
                    )}
                </div>

                {order.special_notes && (
                    <div className="bg-white/5 p-4 rounded-lg border border-white/20">
                        <h4 className="font-bold text-lg mb-2 flex items-center"><FileText className="w-5 h-5 mr-2 text-purple-400"/> Notas Especiales</h4>
                        <p className="text-sm text-gray-300 italic">"{order.special_notes}"</p>
                    </div>
                )}
            </div>

            <div className="bg-white/5 p-4 rounded-lg border border-white/20">
                <h4 className="font-bold text-lg mb-2 flex items-center"><CreditCard className="w-5 h-5 mr-2 text-purple-400"/> Forma de Pago</h4>
                <p className="text-lg font-semibold text-white">{paymentMethodText}</p>
            </div>
        </div>
    </Modal>
  );
};

export default OrderDetailsModal;