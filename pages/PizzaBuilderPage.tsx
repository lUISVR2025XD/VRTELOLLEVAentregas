import React, { useState, useMemo, useEffect } from 'react';
import { Business, Product, UserRole } from '../types';
import { PIZZA_INGREDIENTS } from '../constants';
import Button from '../components/ui/Button';
import ToggleSwitch from '../components/ui/ToggleSwitch';
import { ChevronLeft, ShoppingCart, PlusCircle } from 'lucide-react';
import { notificationService } from '../services/notificationService';


interface PizzaBuilderPageProps {
  business: Business;
  onAddToCart: (baseProduct: Product, configuration: string) => void;
  onGoBack: () => void;
}

const PizzaBuilderPage: React.FC<PizzaBuilderPageProps> = ({ business, onAddToCart, onGoBack }) => {
    const configurablePizzas = useMemo(() => 
        (business.products || []).filter(p => p.is_configurable_pizza)
    , [business.products]);

    const [selectedBaseId, setSelectedBaseId] = useState<string | null>(null);
    const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
    const [hasExtraCheese, setHasExtraCheese] = useState(false);
    const [hasStuffedCrust, setHasStuffedCrust] = useState(false);
    const [notes, setNotes] = useState('');

    const selectedBaseProduct = useMemo(() => 
        configurablePizzas.find(p => p.id === selectedBaseId) || null
    , [selectedBaseId, configurablePizzas]);

    const ingredientCount = useMemo(() => {
        if (!selectedBaseProduct) return 0;
        const match = selectedBaseProduct.name.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    }, [selectedBaseProduct]);

    useEffect(() => {
        // Reset state when base product changes
        if (selectedBaseProduct) {
            setSelectedIngredients(Array(ingredientCount).fill(''));
            setHasExtraCheese(false);
            setHasStuffedCrust(false);
            setNotes('');
        }
    }, [selectedBaseProduct, ingredientCount]);

    const handleIngredientChange = (index: number, value: string) => {
        const newIngredients = [...selectedIngredients];
        newIngredients[index] = value;
        setSelectedIngredients(newIngredients);
    };

    const isAddToCartDisabled = useMemo(() => {
        if (!selectedBaseProduct) return true;
        const filledIngredients = selectedIngredients.filter(ing => ing && ing !== '');
        return filledIngredients.length !== ingredientCount;
    }, [selectedIngredients, ingredientCount, selectedBaseProduct]);

    const handleSubmit = () => {
        if (isAddToCartDisabled || !selectedBaseProduct) return;

        const filledIngredients = selectedIngredients.filter(ing => ing && ing !== '');
        let configurationParts: string[] = [];
        configurationParts.push(`Ingredientes: ${filledIngredients.join(', ')}`);
        if (hasExtraCheese) configurationParts.push('Extra Queso');
        if (hasStuffedCrust) configurationParts.push('Orilla Rellena');
        if (notes) configurationParts.push(`Notas: "${notes}"`);
        
        const configurationString = configurationParts.join('; ');
        onAddToCart(selectedBaseProduct, configurationString);

        notificationService.sendNotification({
            id: `pizza-added-${Date.now()}`,
            role: UserRole.CLIENT,
            title: '¡Pizza Armada!',
            message: `Tu pizza personalizada se agregó al carrito.`,
            type: 'success',
            icon: ShoppingCart
        });

        onGoBack(); // Go back to business menu after adding
    };

    return (
        <div className="container mx-auto p-4 md:p-8 animate-fade-in">
             <Button onClick={onGoBack} variant="secondary" className="mb-6 flex items-center">
                <ChevronLeft className="w-5 h-5 mr-2" />
                Volver al Menú de {business.name}
            </Button>
            <h2 className="text-3xl font-bold mb-2">Arma tu Pizza</h2>
            <p className="text-gray-400 mb-6">Sigue los pasos para crear tu pizza ideal.</p>
            
            <div className="space-y-8">
                {/* Step 1: Size */}
                <div className="p-6 bg-white/10 border border-white/20 rounded-lg">
                    <h3 className="text-xl font-bold mb-4 text-purple-300">Paso 1: Elige el Tamaño</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {configurablePizzas.map(pizza => (
                            <button key={pizza.id} onClick={() => setSelectedBaseId(pizza.id)} 
                                className={`p-4 rounded-lg border-2 text-left transition-all ${selectedBaseId === pizza.id ? 'bg-purple-600 border-purple-400' : 'bg-white/10 border-white/20 hover:border-purple-400'}`}>
                                <p className="font-bold">{pizza.name.replace('Arma tu Pizza - ', '')}</p>
                                <p className="text-lg font-semibold">${pizza.price.toFixed(2)}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Step 2 & 3 - Rendered conditionally */}
                {selectedBaseProduct && (
                    <div className="animate-fade-in space-y-8">
                         {/* Step 2: Ingredients */}
                        <div className="p-6 bg-white/10 border border-white/20 rounded-lg">
                            <h3 className="text-xl font-bold mb-4 text-purple-300">Paso 2: Elige tus {ingredientCount} Ingredientes</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Array.from({ length: ingredientCount }).map((_, index) => (
                                    <select key={index} value={selectedIngredients[index] || ''} onChange={(e) => handleIngredientChange(index, e.target.value)}
                                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                                        <option value="">Ingrediente #{index + 1}</option>
                                        {PIZZA_INGREDIENTS.map(ing => (
                                            <option key={ing} value={ing} disabled={selectedIngredients.includes(ing) && selectedIngredients[index] !== ing}>{ing}</option>
                                        ))}
                                    </select>
                                ))}
                            </div>
                        </div>

                        {/* Step 3: Extras */}
                        <div className="p-6 bg-white/10 border border-white/20 rounded-lg">
                             <h3 className="text-xl font-bold mb-4 text-purple-300">Paso 3: Agrega Extras (Opcional)</h3>
                             <div className="space-y-4">
                                 <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                    <label htmlFor="extra-cheese" className="font-medium">Extra Queso</label>
                                    <ToggleSwitch id="extra-cheese" checked={hasExtraCheese} onChange={setHasExtraCheese} />
                                </div>
                                 <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                    <label htmlFor="stuffed-crust" className="font-medium">Orilla Rellena de Queso</label>
                                    <ToggleSwitch id="stuffed-crust" checked={hasStuffedCrust} onChange={setHasStuffedCrust} />
                                </div>
                                <div>
                                     <label htmlFor="notes" className="font-medium mb-2 block">Indicaciones especiales (ej: mitad y mitad)</label>
                                     <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)}
                                        className="w-full p-2 border rounded-md bg-transparent border-white/20 focus:ring-teal-500 focus:border-teal-500"
                                        rows={2}
                                    ></textarea>
                                </div>
                             </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Footer / Action bar */}
            {selectedBaseProduct && (
                 <div className="mt-8 p-4 bg-gray-900 rounded-lg flex justify-between items-center sticky bottom-4 border border-teal-500/30 shadow-lg">
                    <div>
                        <p className="text-gray-400">Total:</p>
                        <span className="text-3xl font-bold text-teal-300">${selectedBaseProduct.price.toFixed(2)}</span>
                    </div>
                    <Button onClick={handleSubmit} disabled={isAddToCartDisabled} className="!bg-teal-600 hover:!bg-teal-700 text-lg flex items-center gap-2 disabled:!bg-gray-500 disabled:cursor-not-allowed">
                        <PlusCircle />
                        Agregar al Carrito
                    </Button>
                </div>
            )}
        </div>
    );
};

export default PizzaBuilderPage;