import React, { useState, useMemo } from 'react';
import { Business, Product, BusinessLoad } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ProductCard from '../components/client/ProductCard';
import StarRating from '../components/ui/StarRating';
import { ChevronLeft, MapPin, Phone, Star, Clock as ClockIcon, Search } from 'lucide-react';

interface BusinessDetailPageProps {
  business: Business;
  onAddToCart: (product: Product) => void;
  onGoBack: () => void;
}

const getAdjustedDeliveryTime = (deliveryTime: string, load?: BusinessLoad): { text: string; isBusy: boolean } => {
    const timeParts = deliveryTime.match(/\d+/g);
    if (!timeParts || timeParts.length < 2) return { text: deliveryTime, isBusy: false };

    let minTime = parseInt(timeParts[0], 10);
    let maxTime = parseInt(timeParts[1], 10);
    let isBusy = false;

    switch (load) {
        case BusinessLoad.BUSY:
            minTime += 10;
            maxTime += 15;
            isBusy = true;
            break;
        case BusinessLoad.VERY_BUSY:
            minTime += 20;
            maxTime += 25;
            isBusy = true;
            break;
        default:
            break;
    }
    return { text: `${minTime}-${maxTime} min`, isBusy };
};

const MOCK_REVIEWS = [
    { id: 1, author: 'Juan P.', rating: 5, comment: '¡La comida es excelente y llegó súper rápido! Totalmente recomendado.' },
    { id: 2, author: 'Maria G.', rating: 4, comment: 'Muy buen sabor, aunque la porción podría ser un poco más grande.' },
    { id: 3, author: 'Carlos S.', rating: 5, comment: 'El mejor lugar de la zona, siempre pido de aquí.' },
];

const BusinessDetailPage: React.FC<BusinessDetailPageProps> = ({ business, onAddToCart, onGoBack }) => {
  const [productSearch, setProductSearch] = useState('');
  const { text: adjustedTime, isBusy } = getAdjustedDeliveryTime(business.delivery_time, business.current_load);

  const filteredProducts = useMemo(() => {
    if (!business.products) return [];
    if (!productSearch) {
      return business.products;
    }
    const lowercasedQuery = productSearch.toLowerCase();
    return business.products.filter(product => 
      product.name.toLowerCase().includes(lowercasedQuery) ||
      product.category.toLowerCase().includes(lowercasedQuery)
    );
  }, [business.products, productSearch]);


  return (
    <div className="animate-fade-in bg-[#1A0129] min-h-full">
        <div className="container mx-auto p-4 md:p-8">
            <Button onClick={onGoBack} variant="secondary" className="mb-6 flex items-center">
                <ChevronLeft className="w-5 h-5 mr-2" />
                Volver a Restaurantes
            </Button>

            {/* Business Header */}
            <Card className="mb-8 overflow-hidden bg-transparent p-0 border-none">
                <div className="relative">
                    <img src={`https://picsum.photos/seed/${business.id}/1200/400`} alt={business.name} className="w-full h-64 object-cover rounded-t-lg"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-6">
                        <h1 className="text-4xl font-extrabold text-white">{business.name}</h1>
                        <p className="text-lg text-gray-200">{business.category}</p>
                    </div>
                </div>
                <div className="p-4 bg-white/5 flex flex-wrap items-center justify-around text-sm rounded-b-lg">
                    <div className="flex items-center m-2"><Star className="w-5 h-5 text-yellow-400 fill-yellow-400 mr-2" /> <span className="font-bold">{business.rating}</span> <span className="text-gray-400 ml-1"> (100+)</span></div>
                    <div className={`flex items-center m-2 transition-colors ${isBusy ? 'text-orange-400 font-semibold' : ''}`}>
                        <ClockIcon className="w-5 h-5 text-gray-300 mr-2" />
                        <span>{adjustedTime}</span>
                        {isBusy && <span className="text-xs ml-1 whitespace-nowrap">(+ alta demanda)</span>}
                    </div>
                     {!business.is_open && <div className="m-2 px-3 py-1 bg-red-600 text-white rounded-full font-bold text-xs">CERRADO</div>}
                </div>
            </Card>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Products Column */}
                <div className="lg:col-span-2">
                    <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                        <h2 className="text-3xl font-bold">Menú</h2>
                        <div className="relative w-full md:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar en el menú..."
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="w-full p-2 pl-10 border rounded-lg bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {business.products && business.products.length > 0 ? (
                            filteredProducts.length > 0 ? (
                                filteredProducts.map(product => (
                                    <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} businessName={business.name} />
                                ))
                            ) : (
                                <div className="md:col-span-2 text-center py-10 text-gray-400">
                                    <p>No se encontraron productos que coincidan con tu búsqueda.</p>
                                </div>
                            )
                        ) : (
                            <div className="md:col-span-2 text-center py-10 text-gray-400">
                                <p>Este negocio no tiene productos disponibles por el momento.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info & Reviews Column */}
                <div className="lg:col-span-1 space-y-8">
                    <Card className="p-6 bg-white/10 border border-white/20">
                         <h3 className="text-2xl font-bold mb-4">Información</h3>
                         <ul className="space-y-3 text-gray-300">
                             <li className="flex items-start"><MapPin className="w-5 h-5 mr-3 mt-1 flex-shrink-0 text-purple-400"/> <span>{business.address}</span></li>
                             <li className="flex items-center"><Phone className="w-5 h-5 mr-3 flex-shrink-0 text-purple-400"/> <span>{business.phone}</span></li>
                             <li className="flex items-start"><ClockIcon className="w-5 h-5 mr-3 mt-1 flex-shrink-0 text-purple-400"/> <span>{business.opening_hours}</span></li>
                         </ul>
                    </Card>

                     <Card className="p-6 bg-white/10 border border-white/20">
                         <h3 className="text-2xl font-bold mb-4">Opiniones</h3>
                         <ul className="space-y-4">
                             {MOCK_REVIEWS.map(review => (
                                 <li key={review.id} className="border-b border-white/10 pb-3 last:border-b-0">
                                     <div className="flex justify-between items-center mb-1">
                                         <p className="font-semibold">{review.author}</p>
                                         <StarRating rating={review.rating} size={16} />
                                     </div>
                                     <p className="text-gray-400 text-sm">{review.comment}</p>
                                 </li>
                             ))}
                         </ul>
                    </Card>
                </div>
            </div>
        </div>
    </div>
  );
};

export default BusinessDetailPage;