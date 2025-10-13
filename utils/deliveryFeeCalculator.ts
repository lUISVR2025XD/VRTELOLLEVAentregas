import { Business, Location } from '../types';
import { calculateDistance } from './locationUtils';

const BASE_FEE = 30.00;
const PER_KM_FEE = 14.00;

export const calculateDeliveryFee = (business: Business, businessLocation: Location, clientLocation: Location): number => {
    // Option 1: If fixed_delivery_fee > 0, use it.
    if (business.fixed_delivery_fee && business.fixed_delivery_fee > 0) {
        return business.fixed_delivery_fee;
    }

    // Option 2: Calculate based on distance.
    const distance = calculateDistance(businessLocation, clientLocation);

    // Handle edge cases where distance is not valid.
    if (isNaN(distance) || distance <= 0) {
        return 0.00;
    }

    // Round distance to 1 decimal place.
    const roundedDistance = Math.round(distance * 10) / 10;
    
    // First kilometer costs BASE_FEE.
    if (roundedDistance <= 1) {
        return BASE_FEE;
    }

    // Additional kilometers cost PER_KM_FEE.
    const additionalDistance = roundedDistance - 1;
    const totalFee = BASE_FEE + (additionalDistance * PER_KM_FEE);

    // Return fee rounded to 2 decimal places.
    return Math.round(totalFee * 100) / 100;
};