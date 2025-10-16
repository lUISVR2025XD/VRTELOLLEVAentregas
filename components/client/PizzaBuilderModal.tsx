import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../../types';
import { PIZZA_INGREDIENTS } from '../../constants';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import ToggleSwitch from '../ui/ToggleSwitch';

interface PizzaBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onAddToCart: (baseProduct: Product, configuration: string) => void;
}

const PizzaBuilderModal: React.FC<PizzaBuilderModalProps> = ({ isOpen, onClose, product, onAddToCart }) => {
    const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
    const [hasExtraCheese, setHasExtraCheese] = useState(false);
    const [hasStuffedCrust, setHasStuffedCrust] = useState(false);
    const [notes, setNotes] = useState('');

    const { size, ingredientCount } = useMemo(() => {
        const name = product.name.toLowerCase();
        let size = 'Mediana';
        if (name.includes('chica')) size = 'Chica';
        else if (name.includes('grande')) size = 'Grande';
        else if (name.includes('familiar')) size = 'Familiar';
        else if (name.includes('jumbo')) size = 'Jumbo';
        else if (name.includes('cuadrada')) size = 'Cuadrada';

        const match = name.match(/(\d+)/);
        const ingredientCount = match ? parseInt(match[1], 10) : 0;
        
        return { size, ingredientCount };
    }, [product]);

    useEffect(() => {
        if (isOpen) {
            // Reset state when modal opens
            setSelectedIngredients(Array(ingredientCount).fill(''));
            setHasExtraCheese(false);
            setHasStuffedCrust(false);
            setNotes('');
        }
    }, [isOpen, ingredientCount]);

    const handleIngredientChange = (index: number, value: string) => {
        const newIngredients = [...selectedIngredients];
        newIngredients[index] = value;
        setSelectedIngredients(newIngredients);
    };

    const handleSubmit = () => {
        const filledIngredients = selectedIngredients.filter(ing => ing && ing !== '');
        if (filledIngredients.length !== ingredientCount) {
            alert(`Por favor, selecciona los ${ingredientCount} ingredientes.`);
            return;
        }

        let configurationParts: string[] = [];
        configurationParts.push(`Ingredientes: ${filledIngredients.join(', ')}`);
        if (hasExtraCheese) configurationParts.push('Extra Queso');
        if (hasStuffedCrust) configurationParts.push('Orilla Rellena');
        if (notes) configurationParts.push(`Notas: "${notes}"`);

        const configurationString = configurationParts.join('; ');
        onAddToCart(product, configurationString);
    };

    if (!isOpen) return null;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Arma tu Pizza"
            className="!bg-[#1A0129] !text-white !border-teal-500/50 max-w-2xl"
        >
            <div className="space-y-6">
                <div className="p-4 bg-white/10 rounded-lg text-center">
                    <p className="text-gray-300">Estás armando:</p>
                    <h3 className="text-2xl font-bold text-purple-300">{`Pizza ${size} con ${ingredientCount} Ingredientes`}</h3>
                </div>

                <div>
                    <h4 className="font-semibold text-lg mb-2">Elige tus Ingredientes</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Array.from({ length: ingredientCount }).map((_, index) => (
                            <select
                                key={index}
                                value={selectedIngredients[index] || ''}
                                onChange={(e) => handleIngredientChange(index, e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="">Ingrediente #{index + 1}</option>
                                {PIZZA_INGREDIENTS.map(ing => (
                                    <option key={ing} value={ing}>{ing}</option>
                                ))}
                            </select>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold text-lg mb-2">Toppings Adicionales</h4>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                            <label htmlFor="extra-cheese" className="font-medium">Extra Queso</label>
                            <ToggleSwitch id="extra-cheese" checked={hasExtraCheese} onChange={setHasExtraCheese} />
                        </div>
                         <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                            <label htmlFor="stuffed-crust" className="font-medium">Orilla Rellena de Queso</label>
                            <ToggleSwitch id="stuffed-crust" checked={hasStuffedCrust} onChange={setHasStuffedCrust} />
                        </div>
                    </div>
                </div>
                
                <div>
                     <h4 className="font-semibold text-lg mb-2">Extras o Indicaciones</h4>
                     <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ej: mitad y mitad, sin cebolla en una mitad, etc."
                        className="w-full p-2 border rounded-md bg-transparent border-white/20 focus:ring-teal-500 focus:border-teal-500"
                        rows={3}
                    ></textarea>
                </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
                <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
                <Button onClick={handleSubmit} className="!bg-teal-600 hover:!bg-teal-700 text-lg">
                    Agregar al Carrito
                </Button>
            </div>
        </Modal>
    );
};

export default PizzaBuilderModal;