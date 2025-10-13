import React, { useState, useEffect, useCallback } from 'react';
import { Profile, Business, Location } from '../../types';
import { businessService } from '../../services/businessService';
import { compressImage } from '../../utils/imageCompressor';
import { notificationService } from '../../services/notificationService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Building, Phone, MapPin, Upload, Trash2, Image as ImageIcon, FileText, Save, Check, Loader, DollarSign } from 'lucide-react';

// Helper component to handle map interactions
const MapController: React.FC<{ position: Location; setPosition: (pos: Location) => void }> = ({ position, setPosition }) => {
    const map = useMap();
    useEffect(() => {
        // Use a timeout to ensure the map container has been sized correctly,
        // especially when it's rendered inside a tab or conditional component.
        setTimeout(() => {
            map.invalidateSize();
            map.setView([position.lat, position.lng], map.getZoom() || 15);
        }, 100);
    }, [position, map]);

    useMapEvents({
        click(e) {
            setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });
    
    // Fix for default marker icon issue
    const defaultIcon = new L.Icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png', shadowSize: [41, 41]
    });

    return <Marker position={[position.lat, position.lng]} icon={defaultIcon} />;
};

type BusinessFormData = Pick<Business, 'name' | 'phone' | 'address' | 'location' | 'fixed_delivery_fee'>;

// Main Component
const BusinessProfile: React.FC<{ user: Profile }> = ({ user }) => {
    const [business, setBusiness] = useState<Business | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form state consolidated into one object
    const [formData, setFormData] = useState<BusinessFormData>({
        name: '',
        phone: '',
        address: '',
        location: { lat: 19.4326, lng: -99.1332 },
        fixed_delivery_fee: 0,
    });
    
    // File state
    const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
    const [newProfileImageFile, setNewProfileImageFile] = useState<File | null>(null);
    
    type DocumentFile = { file: File; preview: string; name: string; type: 'image' | 'pdf' };
    const [documents, setDocuments] = useState<DocumentFile[]>([]);
    
    useEffect(() => {
        const fetchBusiness = async () => {
            setIsLoading(true);
            const data = await businessService.getBusinessById(user.id);
            if (data) {
                setBusiness(data);
                setFormData({
                    name: data.name,
                    phone: data.phone,
                    address: data.address,
                    location: data.location,
                    fixed_delivery_fee: data.fixed_delivery_fee || 0,
                });
                setProfileImagePreview(data.image);
            }
            setIsLoading(false);
        };
        fetchBusiness();
    }, [user.id]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? parseFloat(value) : value 
        }));
    };
    
    const handleLocationChange = (newLocation: Location) => {
        setFormData(prev => ({ ...prev, location: newLocation }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'profile' | 'document') => {
        const files = e.target.files;
        if (!files) return;

        if (fileType === 'profile') {
            const file = files[0];
            if (file) {
                try {
                    const compressedFile = await compressImage(file, 250);
                    setNewProfileImageFile(compressedFile);
                    setProfileImagePreview(URL.createObjectURL(compressedFile));
                } catch (error) {
                    console.error("Image compression failed:", error);
                    notificationService.sendNotification({ id: `img-error-${Date.now()}`, role: user.role, title: 'Error de Compresión', message: `No se pudo procesar la imagen.`, type: 'error' });
                }
            }
        } else { // 'document'
            for (const file of Array.from(files) as File[]) {
                if (documents.some(d => d.name === file.name)) continue;

                if (file.type.startsWith('image/')) {
                    try {
                        const compressedFile = await compressImage(file, 250);
                        const newDoc: DocumentFile = { file: compressedFile, preview: URL.createObjectURL(compressedFile), name: compressedFile.name, type: 'image' };
                        setDocuments(prev => [...prev, newDoc]);
                    } catch (error) {
                        console.error("Image compression failed:", error);
                    }
                } else if (file.type === 'application/pdf') {
                    if (file.size > 500 * 1024) {
                        notificationService.sendNotification({ id: `pdf-error-${Date.now()}`, role: user.role, title: 'Archivo muy grande', message: `El PDF "${file.name}" supera los 500kb.`, type: 'error' });
                    } else {
                        const newDoc: DocumentFile = { file, preview: '', name: file.name, type: 'pdf' };
                        setDocuments(prev => [...prev, newDoc]);
                    }
                }
            }
        }
    };
    
    const removeDocument = (fileName: string) => {
        setDocuments(prev => prev.filter(doc => doc.name !== fileName));
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
             notificationService.sendNotification({ id: `loc-unsupported-${Date.now()}`, role: user.role, title: 'Geolocalización no soportada', message: 'Tu navegador no soporta esta función.', type: 'error' });
             return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newLocation = { lat: latitude, lng: longitude };
                handleLocationChange(newLocation);
                notificationService.sendNotification({
                    id: `loc-success-${Date.now()}`,
                    role: user.role,
                    title: 'Ubicación Actualizada',
                    message: 'El mapa se ha centrado en tu posición actual.',
                    type: 'success',
                    icon: Check
                });
            },
            (error) => {
                console.error("Error getting current location", error);
                notificationService.sendNotification({
                    id: `loc-error-${Date.now()}`,
                    role: user.role,
                    title: 'Error de Ubicación',
                    message: 'No se pudo obtener tu ubicación. Revisa los permisos de tu navegador.',
                    type: 'error'
                });
            }
        );
    };

    const handleSaveChanges = async () => {
        if (!business) return;
        setIsSaving(true);
        const updates: Partial<Business> = { ...formData };
        
        if (newProfileImageFile) {
            updates.image = profileImagePreview || ''; 
        }
        
        try {
            await businessService.updateBusiness(business.id, updates);
            notificationService.sendNotification({ id: `save-success-${Date.now()}`, role: user.role, title: 'Perfil Actualizado', message: 'Tus cambios han sido guardados.', type: 'success', icon: Check });
        } catch (error) {
             notificationService.sendNotification({ id: `save-error-${Date.now()}`, role: user.role, title: 'Error', message: 'No se pudieron guardar los cambios.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="text-center p-8"><Loader className="animate-spin inline-block" /> Cargando perfil...</div>;
    }
    
    if (!business) {
        return <div className="text-center p-8 text-red-400">No se pudo cargar la información del negocio.</div>
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form and Profile Image */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-6 bg-gray-900/50 border border-teal-500/20">
                        <h3 className="text-xl font-bold mb-4 text-teal-300">Imagen Principal</h3>
                        <img src={profileImagePreview || 'https://via.placeholder.com/400x300'} alt="Vista previa del negocio" className="w-full h-48 object-cover rounded-md mb-4 bg-gray-700"/>
                        <input type="file" id="profileImage" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'profile')} />
                        {/* FIX: Changed the Button component's 'as' prop usage from an attribute to a component tag. */}
                        <Button as="label" htmlFor="profileImage" className="w-full justify-center flex items-center gap-2"><Upload size={18}/> Cambiar Imagen</Button>
                    </Card>

                    <Card className="p-6 bg-gray-900/50 border border-teal-500/20">
                        <h3 className="text-xl font-bold mb-4 text-teal-300">Información de Contacto y Envío</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold mb-1 block">Nombre del Negocio</label>
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full p-2 bg-transparent border-b-2 border-white/20 focus:outline-none focus:border-teal-400" />
                            </div>
                             <div>
                                <label className="text-sm font-semibold mb-1 block">Teléfono</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full p-2 bg-transparent border-b-2 border-white/20 focus:outline-none focus:border-teal-400" />
                            </div>
                             <div>
                                <label className="text-sm font-semibold mb-1 block">Domicilio</label>
                                <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full p-2 bg-transparent border-b-2 border-white/20 focus:outline-none focus:border-teal-400" />
                            </div>
                             <div className="relative">
                                <label htmlFor="fixed_delivery_fee" className="text-sm font-semibold mb-1 block">Precio Fijo de Envío (opcional)</label>
                                <DollarSign className="absolute left-2 bottom-2 h-5 w-5 text-gray-400" />
                                <input type="number" id="fixed_delivery_fee" name="fixed_delivery_fee" value={formData.fixed_delivery_fee} onChange={handleInputChange} className="w-full p-2 pl-8 bg-transparent border-b-2 border-white/20 focus:outline-none focus:border-teal-400" min="0" step="0.01" />
                                <p className="text-xs text-gray-400 mt-1">Si es 0, el costo se calculará por distancia.</p>
                            </div>
                        </div>
                    </Card>
                </div>
                
                {/* Right Column: Map */}
                <div className="lg:col-span-2">
                     <Card className="p-6 h-full bg-gray-900/50 border border-teal-500/20">
                         <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2 gap-2">
                            <h3 className="text-xl font-bold text-teal-300">Ubicación en el Mapa</h3>
                            <Button onClick={handleUseCurrentLocation} variant="secondary" className="!text-xs !py-1 !px-2 flex items-center gap-1 self-start sm:self-center">
                                <MapPin size={14} /> Usar mi ubicación actual
                            </Button>
                         </div>
                         <p className="text-sm text-gray-400 mb-4">Haz clic en el mapa o usa tu ubicación para establecer la posición exacta de tu negocio.</p>
                         <div className="h-96 w-full rounded-lg overflow-hidden z-0">
                            <MapContainer center={[formData.location.lat, formData.location.lng]} zoom={15} className="h-full w-full">
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                                <MapController position={formData.location} setPosition={handleLocationChange} />
                            </MapContainer>
                         </div>
                    </Card>
                </div>
            </div>

            {/* Documents Section */}
            <Card className="p-6 bg-gray-900/50 border border-teal-500/20">
                <h3 className="text-xl font-bold mb-2 text-teal-300">Menú, Promociones y Flyers</h3>
                <p className="text-sm text-gray-400 mb-4">Sube imágenes (JPG, PNG) o PDFs. Las imágenes se comprimirán a ~250kb y los PDFs deben ser menores a 500kb.</p>
                 <input type="file" id="documents" className="hidden" accept="image/*,.pdf" multiple onChange={(e) => handleFileChange(e, 'document')} />
                {/* FIX: Changed the Button component's 'as' prop usage from an attribute to a component tag. */}
                <Button as="label" htmlFor="documents" className="w-full md:w-auto justify-center flex items-center gap-2"><Upload size={18}/> Cargar Archivos</Button>
                
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {documents.map(doc => (
                        <div key={doc.name} className="relative group">
                           {doc.type === 'image' ? (
                                <img src={doc.preview} alt={doc.name} className="w-full h-32 object-cover rounded-md"/>
                           ) : (
                               <div className="w-full h-32 bg-gray-800 rounded-md flex flex-col items-center justify-center p-2">
                                    <FileText className="w-10 h-10 text-red-400 mb-2"/>
                                    <p className="text-xs text-center break-all">{doc.name}</p>
                               </div>
                           )}
                           <button onClick={() => removeDocument(doc.name)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={14}/>
                           </button>
                        </div>
                    ))}
                </div>
            </Card>
            
            <div className="flex justify-end mt-8">
                <Button onClick={handleSaveChanges} disabled={isSaving} className="text-lg bg-teal-600 hover:bg-teal-700 flex items-center gap-2">
                    {isSaving ? <Loader className="animate-spin" size={20}/> : <Save size={20}/>}
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>
        </div>
    );
};


export default BusinessProfile;