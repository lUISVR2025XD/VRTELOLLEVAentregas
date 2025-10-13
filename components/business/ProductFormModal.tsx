import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import ToggleSwitch from '../ui/ToggleSwitch';
import { DollarSign, Image as ImageIcon } from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor';

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (productData: Omit<Product, 'id' | 'image'> & { image: File | string }, productId?: string) => void;
    productToEdit?: Product | null;
    businessId: string;
}

const PRESET_CATEGORIES = ['Entradas', 'Bebidas', 'Parrilladas', 'Alambres', 'Postres', 'Pizzas', 'Hamburguesas'];

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSave, productToEdit, businessId }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [customCategory, setCustomCategory] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState<number | '' >('');
    const [isAvailable, setIsAvailable] = useState(true);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const isEditing = !!productToEdit;

    useEffect(() => {
        if (isOpen) {
            if (productToEdit) {
                setName(productToEdit.name);
                setDescription(productToEdit.description);
                setPrice(productToEdit.price);
                setIsAvailable(productToEdit.is_available);
                setImagePreview(productToEdit.image);
                setImageFile(null); // Clear previous file selection
                if (PRESET_CATEGORIES.includes(productToEdit.category)) {
                    setCategory(productToEdit.category);
                    setCustomCategory('');
                } else {
                    setCategory('OTHER');
                    setCustomCategory(productToEdit.category);
                }
            } else {
                // Reset form for new product
                setName('');
                setDescription('');
                setPrice('');
                setIsAvailable(true);
                setImagePreview(null);
                setImageFile(null);
                setCategory(PRESET_CATEGORIES[0]);
                setCustomCategory('');
            }
        }
    }, [productToEdit, isOpen]);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressedFile = await compressImage(file, 250);
                setImageFile(compressedFile);
                setImagePreview(URL.createObjectURL(compressedFile));
            } catch (error) {
                console.error("Image compression failed:", error);
            }
        }
    };

    const handleSave = () => {
        const finalCategory = category === 'OTHER' ? customCategory : category;
        const numericPrice = Number(price);
        if (!name || !finalCategory || isNaN(numericPrice) || numericPrice <= 0) {
            alert('Por favor, completa Nombre, Categoría y un Precio válido.');
            return;
        }

        const productData = {
            business_id: businessId,
            name,
            category: finalCategory,
            description,
            price: numericPrice,
            is_available: isAvailable,
            image: imageFile || imagePreview || ''
        };
        
        onSave(productData, productToEdit?.id);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Producto' : 'Agregar Producto'} className="!bg-[#1A0129] !text-white !border-teal-500/50 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="text-sm font-semibold mb-2 block">Imagen del Producto</label>
                    <div className="w-full h-48 bg-gray-700/50 rounded-md flex items-center justify-center border-2 border-dashed border-gray-500 relative">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Vista previa" className="w-full h-full object-cover rounded-md" />
                        ) : (
                            <div className="text-center text-gray-400">
                                <ImageIcon size={48} className="mx-auto" />
                                <p>Sube una imagen</p>
                            </div>
                        )}
                        <label htmlFor="productImage" className="absolute inset-0 w-full h-full cursor-pointer"></label>
                        <input type="file" id="productImage" className="sr-only" accept="image/*" onChange={handleImageChange} />
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className="text-sm font-semibold mb-1 block">Nombre</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 bg-transparent border-b-2 border-white/20 focus:outline-none focus:border-teal-400" />
                    </div>
                    <div>
                        <label htmlFor="category" className="text-sm font-semibold mb-1 block">Categoría</label>
                        <select id="category" value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500">
                            {PRESET_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            <option value="OTHER">Otra...</option>
                        </select>
                        {category === 'OTHER' && (
                             <input type="text" placeholder="Nombre de la categoría" value={customCategory} onChange={e => setCustomCategory(e.target.value)} className="w-full mt-2 p-2 bg-transparent border-b-2 border-white/20 focus:outline-none focus:border-teal-400" />
                        )}
                    </div>
                    <div className="relative">
                        <label htmlFor="price" className="text-sm font-semibold mb-1 block">Precio</label>
                         <DollarSign className="absolute left-2 top-9 h-5 w-5 text-gray-400" />
                        <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2 pl-8 bg-transparent border-b-2 border-white/20 focus:outline-none focus:border-teal-400" min="0" />
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <label htmlFor="description" className="text-sm font-semibold mb-1 block">Descripción</label>
                <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"></textarea>
            </div>
            
             <div className="mt-6 flex items-center justify-between">
                <span className="font-semibold">Disponibilidad</span>
                <ToggleSwitch id="availability" checked={isAvailable} onChange={setIsAvailable} label={isAvailable ? 'En existencia' : 'Agotado'} />
            </div>

            <div className="mt-8 flex justify-end gap-4">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave} className="!bg-teal-600 hover:!bg-teal-700">{isEditing ? 'Guardar Cambios' : 'Crear Producto'}</Button>
            </div>
        </Modal>
    );
};

export default ProductFormModal;
