
import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  setRating?: (rating: number) => void;
  size?: number;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, setRating, size = 20, className = '' }) => {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`cursor-pointer transition-colors ${
            star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'
          }`}
          onClick={() => setRating && setRating(star)}
        />
      ))}
    </div>
  );
};

export default StarRating;
