import React from 'react';
import { Product } from '../../types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ShoppingCart, Edit } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  businessName: string;
  onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, businessName, onAddToCart }) => {
  const isConfigurable = product.is_configurable_pizza;
  
  return (
    <Card className="flex flex-col bg-white/10 border border-white/20 transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-900/50">
      <img src={product.image} alt={product.name} className="w-full h-40 object-cover" />
      <div className="p-4 flex flex-col flex-grow">
        <h4 className="text-lg font-bold truncate">{product.name}</h4>
        <p className="text-sm text-gray-400">{businessName}</p>
        <div className="flex justify-between items-center mt-4">
          <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
          <Button onClick={() => onAddToCart(product)} className="flex items-center !px-3 !py-2">
            {isConfigurable ? <Edit className="w-5 h-5 mr-2" /> : <ShoppingCart className="w-5 h-5 mr-2" />}
            {isConfigurable ? 'Armar' : 'Pedir'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;