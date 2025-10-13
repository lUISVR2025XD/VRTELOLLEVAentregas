import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Location } from '../../types';
import L from 'leaflet';
import Button from '../ui/Button';
import { MessageSquare, Check } from 'lucide-react';

// FIX: Global fix for default Leaflet icon issue with webpack
// This prevents Leaflet from trying to guess icon paths, which often break in module bundlers.
// By setting the paths explicitly to a CDN, we ensure they always load correctly.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


const iconBusiness = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    shadowSize: [41, 41]
});

const iconDelivery = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    shadowSize: [41, 41]
});

interface OrderTrackingMapProps {
  clientLocation?: Location;
  businessLocation?: Location;
  deliveryLocation?: Location;
  center: Location;
  zoom?: number;
  className?: string;
  quickMessages?: string[];
  onSendQuickMessage?: (message: string) => void;
  isSendingAllowed?: boolean;
}

const OrderTrackingMap: React.FC<OrderTrackingMapProps> = ({
  clientLocation,
  businessLocation,
  deliveryLocation,
  center,
  zoom = 13,
  className = 'h-96',
  quickMessages = [],
  // FIX: Updated default value to accept an argument to match the prop type, resolving the type error.
  onSendQuickMessage = (_message) => {},
  isSendingAllowed = false,
}) => {
    const [map, setMap] = useState<L.Map | null>(null);
    const [sentMessage, setSentMessage] = useState<string | null>(null);

    // This effect is responsible for automatically adjusting the map view.
    // It runs whenever the map instance is ready or any of the key locations change.
    useEffect(() => {
        // Ensure the map instance is available before proceeding.
        if(map) {
            // Create a LatLngBounds object to encompass all important points.
            const bounds = L.latLngBounds([]);
            
            // Add each location to the bounds if it exists.
            if(clientLocation) bounds.extend([clientLocation.lat, clientLocation.lng]);
            if(businessLocation) bounds.extend([businessLocation.lat, businessLocation.lng]);
            if(deliveryLocation) bounds.extend([deliveryLocation.lat, deliveryLocation.lng]);

            // Only adjust the map view if the bounds are valid (i.e., contain at least one point).
            if(bounds.isValid()) {
                // Use fitBounds to smoothly pan and zoom the map to show all markers.
                // The padding ensures markers aren't right at the edge of the map.
                // The animation makes the transition feel seamless as the delivery location updates.
                map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.5 });
            } else {
                // If no locations are available, center the map on the default center point.
                map.setView([center.lat, center.lng], zoom);
            }
        }
    // The dependency array ensures this effect re-runs whenever a location prop changes,
    // keeping the map view perfectly synchronized with the real-time data.
    }, [map, clientLocation, businessLocation, deliveryLocation, center, zoom]);
    
    const handleSendMessage = (message: string) => {
        if (sentMessage) return; // Prevent sending another message while one is in its "sent" state
        onSendQuickMessage(message);
        setSentMessage(message);
        setTimeout(() => {
            setSentMessage(null);
        }, 3000);
    };


  return (
    <div className={`relative ${className}`}>
      {/* FIX: Replaced 'whenCreated' with 'ref' to correctly get the map instance from react-leaflet, resolving the type error. */}
      <MapContainer center={[center.lat, center.lng]} zoom={zoom} scrollWheelZoom={false} className="h-full w-full" ref={setMap}>
        <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {businessLocation && (
            <Marker position={[businessLocation.lat, businessLocation.lng]} icon={iconBusiness}>
            <Popup>Negocio</Popup>
            </Marker>
        )}
        {deliveryLocation && (
            <Marker position={[deliveryLocation.lat, deliveryLocation.lng]} icon={iconDelivery}>
            <Popup>Repartidor</Popup>
            </Marker>
        )}
        {clientLocation && (
            <Marker position={[clientLocation.lat, clientLocation.lng]}>
            <Popup>Tu ubicación de entrega</Popup>
            </Marker>
        )}
        
        {businessLocation && deliveryLocation && (
            <Polyline positions={[[businessLocation.lat, businessLocation.lng], [deliveryLocation.lat, deliveryLocation.lng]]} color="orange" dashArray="5, 10" />
        )}
        {deliveryLocation && clientLocation && (
            <Polyline positions={[[deliveryLocation.lat, deliveryLocation.lng], [clientLocation.lat, clientLocation.lng]]} color="blue" />
        )}
      </MapContainer>

       {isSendingAllowed && (
            <div className="absolute bottom-4 left-4 right-4 md:left-auto md:max-w-sm bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-[1000]">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-200 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-orange-500" />
                    Mensajes Rápidos al Repartidor
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {quickMessages.map(msg => {
                        const isSent = sentMessage === msg;
                        return (
                        <Button 
                            key={msg} 
                            onClick={() => handleSendMessage(msg)} 
                            className={`text-sm w-full text-left p-3 h-auto justify-start transition-colors ${
                                isSent
                                ? '!bg-green-500 !text-white'
                                : '!bg-gray-100 hover:!bg-gray-200 !text-gray-800 dark:!bg-white/10 dark:hover:!bg-white/20 dark:!text-gray-200'
                            }`}
                            disabled={sentMessage !== null}
                        >
                            {isSent ? (
                                <div className="flex items-center">
                                    <Check className="w-5 h-5 mr-2" />
                                    Enviado
                                </div>
                            ) : (
                                msg
                            )}
                        </Button>
                    )})}
                </div>
            </div>
        )}
    </div>
  );
};

export default OrderTrackingMap;