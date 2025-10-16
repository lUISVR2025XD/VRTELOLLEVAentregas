
import React, { useMemo } from 'react';
import { Business, FilterState } from '../../types';
import Card from '@/components/ui/Card';
import StarRating from '../ui/StarRating';
import Button from '@/components/ui/Button';
import { SlidersHorizontal, X, Clock, DollarSign, MapPin } from 'lucide-react';

interface BusinessFiltersProps {
  businesses: Business[];
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onClearFilters: () => void;
}

const BusinessFilters: React.FC<BusinessFiltersProps> = ({ businesses, filters, onFilterChange, onClearFilters }) => {
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    businesses.forEach(b => categories.add(b.category));
    return Array.from(categories).sort();
  }, [businesses]);

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    onFilterChange({ categories: newCategories });
  };
  
  const handleRatingChange = (rating: number) => {
      onFilterChange({ minRating: filters.minRating === rating ? 0 : rating });
  }

  const hasActiveFilters = filters.categories.length > 0 || filters.minRating > 0 || filters.maxDeliveryTime > 0 || filters.openNow || filters.maxDistance > 0;

  return (
    <Card className="p-4 mb-8 bg-white/10 border border-white/20">
      <div className="flex flex-col gap-4">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <h3 className="text-lg font-semibold flex items-center"><SlidersHorizontal className="mr-2 h-5 w-5"/>Filtros</h3>
             {hasActiveFilters && (
                <Button onClick={onClearFilters} variant="secondary" className="flex items-center gap-1 text-sm !py-1.5 !px-3">
                    <X className="h-4 w-4" />
                    Limpiar Filtros
                </Button>
            )}
         </div>
        
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
             <div>
                <span className="font-semibold text-sm mb-2 block">Calificación:</span>
                <StarRating rating={filters.minRating} setRating={handleRatingChange} />
             </div>
             <div>
                <span className="font-semibold text-sm mb-2 block">Entrega:</span>
                <div className="flex gap-2">
                     <Button variant={filters.maxDeliveryTime === 30 ? 'primary' : 'secondary'} onClick={() => onFilterChange({ maxDeliveryTime: filters.maxDeliveryTime === 30 ? 0 : 30 })} className="!text-xs !py-1 !px-3 w-full justify-center flex items-center"><Clock className="w-4 h-4 mr-1"/>-30 min</Button>
                     <Button variant={filters.maxDeliveryTime === 45 ? 'primary' : 'secondary'} onClick={() => onFilterChange({ maxDeliveryTime: filters.maxDeliveryTime === 45 ? 0 : 45 })} className="!text-xs !py-1 !px-3 w-full justify-center flex items-center"><Clock className="w-4 h-4 mr-1"/>-45 min</Button>
                </div>
             </div>
              <div>
                <span className="font-semibold text-sm mb-2 block">Distancia:</span>
                <div className="flex gap-2">
                     <Button variant={filters.maxDistance === 3 ? 'primary' : 'secondary'} onClick={() => onFilterChange({ maxDistance: filters.maxDistance === 3 ? 0 : 3 })} className="!text-xs !py-1 !px-3 w-full justify-center flex items-center"><MapPin className="w-4 h-4 mr-1"/>-3 km</Button>
                     <Button variant={filters.maxDistance === 5 ? 'primary' : 'secondary'} onClick={() => onFilterChange({ maxDistance: filters.maxDistance === 5 ? 0 : 5 })} className="!text-xs !py-1 !px-3 w-full justify-center flex items-center"><MapPin className="w-4 h-4 mr-1"/>-5 km</Button>
                </div>
             </div>
              <div className="flex items-center justify-start md:justify-center gap-2 pt-5">
                <span className="font-semibold text-sm">Abierto Ahora:</span>
                <button
                    onClick={() => onFilterChange({ openNow: !filters.openNow })}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                        filters.openNow ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                >
                    <span
                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                            filters.openNow ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                </button>
            </div>
         </div>
        
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
             <button
                onClick={() => onFilterChange({ categories: [] })}
                className={`px-4 py-2 text-sm rounded-md transition-colors border-b-2 ${
                    filters.categories.length === 0
                    ? 'border-purple-400 text-white font-semibold'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
                >
                Todos
            </button>
            {uniqueCategories.map(category => (
                <button
                key={category}
                onClick={() => handleCategoryToggle(category)}
                className={`px-4 py-2 text-sm rounded-md transition-colors border-b-2 ${
                    filters.categories.includes(category)
                    ? 'border-purple-400 text-white font-semibold'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
                >
                    {category}
                </button>
            ))}
        </div>
      </div>
    </Card>
  );
};

export default BusinessFilters;
