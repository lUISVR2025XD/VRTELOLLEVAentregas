
import React, { useState } from 'react';
import { Order } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import StarRating from '../ui/StarRating';

interface RatingModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onSubmit: (ratings: { business: number; delivery: number }) => void;
}

const RatingModal: React.FC<RatingModalProps> = ({ isOpen, order, onClose, onSubmit }) => {
  const [businessRating, setBusinessRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);

  if (!isOpen || !order) return null;

  const handleSubmit = () => {
    if (businessRating === 0 || (order.delivery_person && deliveryRating === 0)) {
      alert("Por favor, califica tanto al negocio como al repartidor.");
      return;
    }
    onSubmit({ business: businessRating, delivery: deliveryRating });
  };

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="Califica tu Experiencia"
        className="!bg-[#2C0054] !text-white border-2 border-purple-800"
    >
      <div className="text-center space-y-6">
        <p className="text-gray-300">Tu opinión nos ayuda a mejorar. ¿Cómo fue tu pedido de <span className="font-bold">{order.business?.name}</span>?</p>
        
        <div className="p-4 bg-white/10 rounded-lg">
          <p className="font-semibold text-lg mb-2">Calificar al Negocio</p>
          <p className="text-sm text-gray-400 mb-3">{order.business?.name}</p>
          <StarRating rating={businessRating} setRating={setBusinessRating} size={32} />
        </div>

        {order.delivery_person && (
          <div className="p-4 bg-white/10 rounded-lg">
            <p className="font-semibold text-lg mb-2">Calificar al Repartidor</p>
            <p className="text-sm text-gray-400 mb-3">{order.delivery_person.name}</p>
            <StarRating rating={deliveryRating} setRating={setDeliveryRating} size={32} />
          </div>
        )}
        
        <Button onClick={handleSubmit} className="w-full text-lg bg-purple-600 hover:bg-purple-700">
          Enviar Calificación
        </Button>
      </div>
    </Modal>
  );
};

export default RatingModal;
