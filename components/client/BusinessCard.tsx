

import React from 'react';
import { Business, BusinessLoad } from '../../types';
import Card from '@/components/ui/Card';
import { Star, Clock } from 'lucide-react';

interface BusinessCardProps {
  business: Business;
  onClick?: () => void;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business, onClick }) => {

  return (
    <Card 
      onClick={onClick}
      className={`bg-white/10 border border-white/20 transform transition-transform duration-300 hover:scale-105 hover:shadow-xl ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="relative">
        <img src={business.image} alt={business.name} className="w-full h-48 object-cover" />
        {!business.is_open && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                <span className="text-white font-bold text-lg rounded-full bg-red-600 px-4 py-1">CERRADO</span>
            </div>
        )}
         <div className="absolute top-2 right-2 flex items-center bg-black/50 text-white px-2 py-1 rounded-full text-xs font-semibold">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
            <span>{business.rating}</span>
          </div>
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold truncate">{business.name}</h3>
        <p className="text-gray-400 text-sm">{business.category}</p>
      </div>
    </Card>
  );
};

export default BusinessCard;