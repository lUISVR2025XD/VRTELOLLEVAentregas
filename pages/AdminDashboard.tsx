import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Profile, Order, OrderStatus, UserRole, Business, DeliveryPerson, PaymentMethod } from '../types';
import { APP_NAME, MOCK_USER_LOCATION, USER_ROLES, USER_ROLE_MAP, ORDER_STATUS_MAP } from '../constants';
import { authService } from '../services/authService';
import { businessService } from '../services/businessService';
import { deliveryService } from '../services/deliveryService';
import { orderService } from '../services/orderService';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Users, Bike, Briefcase, Activity, MoreVertical, Search, Edit, UserCheck, UserX, ClipboardList, Star, ChevronUp, ChevronDown, CheckCircle, XCircle, Clock, BarChart2, DollarSign, RefreshCw } from 'lucide-react';
import StatsCard from '../components/ui/StatsCard';
import DropdownMenu, { DropdownMenuItem } from '../components/ui/DropdownMenu';
import Badge from '../components/ui/Badge';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import StarRating from '../components/ui/StarRating';


interface AdminDashboardProps {
  user: Profile;
  onLogout: () => void;
}

const MOCK_LIVE_ORDERS: Order[] = [
    {
        id: 'order-123', client_id: 'client-1', business_id: 'business-1', delivery_person_id: 'delivery-1',
        items: [], total_price: 155, delivery_fee: 30, status: OrderStatus.ON_THE_WAY, 
        payment_method: PaymentMethod.CASH,
        delivery_address: 'Av. de la Reforma 222, Juárez, 06600, CDMX',
        special_notes: 'Tocar en la puerta de madera, por favor.',
        delivery_location: { lat: 19.4350, lng: -99.1350 },
        business: { id: 'business-1', name: 'Taquería El Pastor', location: { lat: 19.4300, lng: -99.1300 }, category: 'Mexicana', fixed_delivery_fee: 30, delivery_time: '25-35 min', image: '', is_open: true, phone: '', address: '', email: '', rating: 4.8, rating_count: 152, opening_hours: 'L-D: 12:00 - 23:00' },
        delivery_person: { id: 'delivery-1', name: 'Pedro R.', location: { lat: 19.4325, lng: -99.1325 }, is_online: true, vehicle: '', current_deliveries: 0, email: '', phone: '', rating: 4.9, rating_count: 45, approvalStatus: 'approved', isActive: true },
        created_at: new Date().toISOString(),
    },
    {
        id: 'order-125', client_id: 'client-3', business_id: 'business-2',
        items: [], total_price: 225, delivery_fee: 0, status: OrderStatus.READY_FOR_PICKUP, 
        payment_method: PaymentMethod.TRANSFER,
        delivery_address: 'Calle de Madero 1, Centro Histórico, 06000, CDMX',
        special_notes: 'Sin salsa picante.',
        delivery_location: { lat: 19.4250, lng: -99.1450 },
        business: { id: 'business-2', name: 'Sushi Express', location: { lat: 19.4350, lng: -99.1400 }, category: 'Japonesa', fixed_delivery_fee: 0, delivery_time: '30-40 min', image: '', is_open: true, phone: '', address: '', email: '', rating: 4.6, rating_count: 88, opening_hours: 'M-S: 13:00 - 22:00' },
        created_at: new Date().toISOString(),
    }
];

type AdminView = 'overview' | 'users' | 'businesses' | 'delivery' | 'statistics';
type SortDirection = 'ascending' | 'descending';

// --- Chart Components for Statistics ---
const OrdersOverTimeChart: React.FC<{ data: { date: string; count: number }[] }> = ({ data }) => {
    const maxCount = Math.max(...data.map(d => d.count), 0);
    const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - (d.count / maxCount) * 90}`).join(' ');

    return (
        <div className="h-64 w-full relative">
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="statsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4"/>
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0"/>
                    </linearGradient>
                </defs>
                <polyline fill="url(#statsGradient)" stroke="none" points={`0,100 ${points} 100,100`} />
                <polyline fill="none" stroke="#8b5cf6" strokeWidth="1" points={points} />
            </svg>
            <div className="absolute -bottom-2 w-full flex justify-between text-xs text-gray-400 px-2">
                <span>{data[0]?.date}</span>
                <span>{data[data.length - 1]?.date}</span>
            </div>
        </div>
    );
};

const TopItemsChart: React.FC<{ data: { name: string; value: number }[]; isCurrency?: boolean }> = ({ data, isCurrency = false }) => {
    const maxValue = Math.max(...data.map(d => d.value), 0);
    return (
        <div className="space-y-3">
            {data.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3 text-sm">
                    <span className="w-1/3 text-gray-600 truncate" title={item.name}>{item.name}</span>
                    <div className="w-2/3 bg-gray-200 rounded-full h-5">
                        <div
                            className="bg-purple-500 h-5 rounded-full text-xs text-white flex items-center justify-end pr-2 font-semibold transition-all duration-500 ease-out"
                            style={{ width: `${(item.value / maxValue) * 100}%` }}
                        >
                            {isCurrency ? `$${item.value.toLocaleString()}` : item.value}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- End Chart Components ---


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


const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
    const [liveOrders, setLiveOrders] = useState(MOCK_LIVE_ORDERS);
    const [currentView, setCurrentView] = useState<AdminView>('overview');
    
    // State for User Management
    const [users, setUsers] = useState<Profile[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [usersError, setUsersError] = useState<string | null>(null);
    const [userModalState, setUserModalState] = useState<{ isOpen: boolean; user: Profile | null; action: 'activate' | 'deactivate' | null }>({ isOpen: false, user: null, action: null });

    // State for Business Management
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [businessesLoading, setBusinessesLoading] = useState(true);
    const [businessesError, setBusinessesError] = useState<string | null>(null);
    const [businessModalState, setBusinessModalState] = useState<{ isOpen: boolean; business: Business | null; action: 'approve' | 'reject' | 'activate' | 'deactivate' | null }>({ isOpen: false, business: null, action: null });

    // State for Delivery Management
    const [deliveryPeople, setDeliveryPeople] = useState<DeliveryPerson[]>([]);
    const [deliveryLoading, setDeliveryLoading] = useState(true);
    const [deliveryError, setDeliveryError] = useState<string | null>(null);
    const [deliveryModalState, setDeliveryModalState] = useState<{ isOpen: boolean; person: DeliveryPerson | null; action: 'approve' | 'reject' | 'activate' | 'deactivate' | null }>({ isOpen: false, person: null, action: null });
    
    // State for Statistics
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [statsDateRange, setStatsDateRange] = useState({ start: '', end: '' });
    const [statsBusinessId, setStatsBusinessId] = useState('ALL');
    const [statsDeliveryId, setStatsDeliveryId] = useState('ALL');
    
    // Shared State for Filters and Sorting
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({ key: 'name', direction: 'ascending' });

    // View-specific filters
    const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
    const [businessCategoryFilter, setBusinessCategoryFilter] = useState<'ALL' | string>('ALL');
    const [businessApprovalFilter, setBusinessApprovalFilter] = useState<'ALL' | Business['approvalStatus']>('ALL');
    const [deliveryApprovalFilter, setDeliveryApprovalFilter] = useState<'ALL' | DeliveryPerson['approvalStatus']>('ALL');
    const [deliveryOnlineFilter, setDeliveryOnlineFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');


    // Effect for live order simulation
    useEffect(() => {
        const interval = setInterval(() => {
           setLiveOrders(prev => prev.map(o => {
               if(o.status === OrderStatus.ON_THE_WAY && o.delivery_person) {
                   const newLat = o.delivery_person.location.lat + (o.delivery_location.lat - o.delivery_person.location.lat) * 0.05;
                   const newLng = o.delivery_person.location.lng + (o.delivery_location.lng - o.delivery_person.location.lng) * 0.05;
                   return {...o, delivery_person: {...o.delivery_person, location: {lat: newLat, lng: newLng}}};
               }
               return o;
           }))
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        setUsersLoading(true);
        setBusinessesLoading(true);
        setDeliveryLoading(true);
        try {
            const [usersData, businessesData, deliveryData, ordersData] = await Promise.all([
                authService.getAllUsers(),
                businessService.getAllBusinesses(),
                deliveryService.getAllDeliveryPeople(),
                orderService.getOrders({}), // Fetch all orders for stats
            ]);
            setUsers(usersData);
            setBusinesses(businessesData);
            setDeliveryPeople(deliveryData);
            setAllOrders(ordersData);
        } catch (error: any) {
            setUsersError(error.message);
            setBusinessesError(error.message);
            setDeliveryError(error.message);
        } finally {
            setUsersLoading(false);
            setBusinessesLoading(false);
            setDeliveryLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- USER MANAGEMENT LOGIC ---
    const handleUpdateUser = async (userId: string, updates: Partial<Profile>) => {
        try {
            const updatedUser = await authService.updateUser(userId, updates);
            setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, ...updatedUser } : u));
        } catch (err: any) {
            setUsersError(err.message);
        }
    };

    const openUserConfirmationModal = (user: Profile, action: 'activate' | 'deactivate') => {
        setUserModalState({ isOpen: true, user, action });
    };

    const handleConfirmUserAction = () => {
        if (userModalState.user && userModalState.action) {
            handleUpdateUser(userModalState.user.id, { isActive: userModalState.action === 'activate' });
        }
        setUserModalState({ isOpen: false, user: null, action: null });
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [users, searchQuery, roleFilter]);


    // --- BUSINESS MANAGEMENT LOGIC ---
    const handleUpdateBusiness = async (businessId: string, updates: Partial<Business>) => {
        try {
            const updatedBusiness = await businessService.updateBusiness(businessId, updates);
            setBusinesses(prev => prev.map(b => b.id === businessId ? updatedBusiness : b));
        } catch (err: any) {
            setBusinessesError(err.message);
        }
    };

    const openBusinessConfirmationModal = (business: Business, action: 'approve' | 'reject' | 'activate' | 'deactivate') => {
        setBusinessModalState({ isOpen: true, business, action });
    };

    const handleConfirmBusinessAction = () => {
        if (businessModalState.business && businessModalState.action) {
            const { business, action } = businessModalState;
            switch (action) {
                case 'approve':
                    handleUpdateBusiness(business.id, { approvalStatus: 'approved', isActive: true });
                    break;
                case 'reject':
                    handleUpdateBusiness(business.id, { approvalStatus: 'rejected', isActive: false });
                    break;
                case 'activate':
                    handleUpdateBusiness(business.id, { isActive: true });
                    break;
                case 'deactivate':
                    handleUpdateBusiness(business.id, { isActive: false });
                    break;
            }
        }
        setBusinessModalState({ isOpen: false, business: null, action: null });
    };
    
    const uniqueBusinessCategories = useMemo(() => Array.from(new Set(businesses.map(b => b.category))), [businesses]);

    const sortedAndFilteredBusinesses = useMemo(() => {
        let filtered = businesses.filter(b => {
            const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = businessCategoryFilter === 'ALL' || b.category === businessCategoryFilter;
            const matchesApproval = businessApprovalFilter === 'ALL' || b.approvalStatus === businessApprovalFilter;
            return matchesSearch && matchesCategory && matchesApproval;
        });

        const sortKey = sortConfig.key as keyof Business;
        if (sortKey) {
            filtered.sort((a, b) => {
                const aValue = a[sortKey];
                const bValue = b[sortKey];
                if (aValue === undefined || aValue === null || aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (bValue === undefined || bValue === null || aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [businesses, searchQuery, businessCategoryFilter, businessApprovalFilter, sortConfig]);


    // --- DELIVERY MANAGEMENT LOGIC ---
    const handleUpdateDeliveryPerson = async (personId: string, updates: Partial<DeliveryPerson>) => {
        try {
            const updatedPerson = await deliveryService.updateDeliveryPerson(personId, updates);
            setDeliveryPeople(prev => prev.map(p => p.id === personId ? updatedPerson : p));
        } catch (err: any) {
            setDeliveryError(err.message);
        }
    };
    
    const openDeliveryConfirmationModal = (person: DeliveryPerson, action: 'approve' | 'reject' | 'activate' | 'deactivate') => {
        setDeliveryModalState({ isOpen: true, person, action });
    };

    const handleConfirmDeliveryAction = () => {
        if (deliveryModalState.person && deliveryModalState.action) {
            const { person, action } = deliveryModalState;
            switch (action) {
                case 'approve':
                    handleUpdateDeliveryPerson(person.id, { approvalStatus: 'approved', isActive: true });
                    break;
                case 'reject':
                    handleUpdateDeliveryPerson(person.id, { approvalStatus: 'rejected', isActive: false });
                    break;
                case 'activate':
                    handleUpdateDeliveryPerson(person.id, { isActive: true });
                    break;
                case 'deactivate':
                    handleUpdateDeliveryPerson(person.id, { isActive: false });
                    break;
            }
        }
        setDeliveryModalState({ isOpen: false, person: null, action: null });
    };

    const sortedAndFilteredDeliveryPeople = useMemo(() => {
        let filtered = deliveryPeople.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesApproval = deliveryApprovalFilter === 'ALL' || p.approvalStatus === deliveryApprovalFilter;
            const matchesOnline = deliveryOnlineFilter === 'ALL' || (deliveryOnlineFilter === 'ONLINE' ? p.is_online : !p.is_online);
            return matchesSearch && matchesApproval && matchesOnline;
        });

        const sortKey = sortConfig.key as keyof DeliveryPerson;
        if (sortKey) {
            filtered.sort((a, b) => {
                const aValue = a[sortKey];
                const bValue = b[sortKey];
                if (aValue === undefined || aValue === null || aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (bValue === undefined || bValue === null || aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [deliveryPeople, searchQuery, deliveryApprovalFilter, deliveryOnlineFilter, sortConfig]);

    // --- STATISTICS LOGIC ---
    const filteredStatsData = useMemo(() => {
        let filteredOrders = allOrders;

        // Date filtering
        if (statsDateRange.start && statsDateRange.end) {
            const startDate = new Date(statsDateRange.start);
            const endDate = new Date(statsDateRange.end);
            endDate.setHours(23, 59, 59, 999); // Include the whole end day

            filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.created_at);
                return orderDate >= startDate && orderDate <= endDate;
            });
        }

        // Business filtering
        if (statsBusinessId !== 'ALL') {
            filteredOrders = filteredOrders.filter(order => order.business_id === statsBusinessId);
        }

        // Delivery person filtering
        if (statsDeliveryId !== 'ALL') {
            filteredOrders = filteredOrders.filter(order => order.delivery_person_id === statsDeliveryId);
        }
        
        return filteredOrders;
    }, [allOrders, statsDateRange, statsBusinessId, statsDeliveryId]);

    const statsKPIs = useMemo(() => {
        const deliveredOrders = filteredStatsData.filter(o => o.status === 'DELIVERED');
        const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.total_price, 0);
        const totalOrders = filteredStatsData.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        return { totalRevenue, totalOrders, avgOrderValue };
    }, [filteredStatsData]);
    
    const ordersByDay = useMemo(() => {
        const counts: { [key: string]: number } = {};
        filteredStatsData.forEach(order => {
            const date = new Date(order.created_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric'});
            counts[date] = (counts[date] || 0) + 1;
        });
        return Object.entries(counts).map(([date, count]) => ({ date, count }));
    }, [filteredStatsData]);
    
    const topBusinessesByOrders = useMemo(() => {
        const counts: { [key: string]: { name: string, count: number } } = {};
        filteredStatsData.forEach(order => {
            if (!counts[order.business_id]) counts[order.business_id] = { name: order.business?.name || 'N/A', count: 0 };
            counts[order.business_id].count += 1;
        });
        return Object.values(counts).sort((a,b) => b.count - a.count).slice(0, 5).map(item => ({ name: item.name, value: item.count}));
    }, [filteredStatsData]);

    const topDeliveryByOrders = useMemo(() => {
        const counts: { [key: string]: { name: string, count: number } } = {};
        filteredStatsData.filter(o => o.status === 'DELIVERED').forEach(order => {
             if (order.delivery_person_id) {
                if (!counts[order.delivery_person_id]) counts[order.delivery_person_id] = { name: order.delivery_person?.name || 'N/A', count: 0 };
                counts[order.delivery_person_id].count += 1;
             }
        });
        return Object.values(counts).sort((a,b) => b.count - a.count).slice(0, 5).map(item => ({ name: item.name, value: item.count}));
    }, [filteredStatsData]);



    // --- SHARED UI LOGIC ---
    const requestSort = (key: string) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader: React.FC<{ sortKey: string; children: React.ReactNode }> = ({ sortKey, children }) => (
        <th scope="col" className="p-4 cursor-pointer" onClick={() => requestSort(sortKey)}>
            <div className="flex items-center">
                {children}
                {sortConfig.key === sortKey && (
                    sortConfig.direction === 'ascending' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                )}
            </div>
        </th>
    );

    const navItems = [
        { id: 'overview', label: 'Vista General', icon: Activity },
        { id: 'users', label: 'Usuarios', icon: Users },
        { id: 'businesses', label: 'Negocios', icon: Briefcase },
        { id: 'delivery', label: 'Repartidores', icon: Bike },
        { id: 'statistics', label: 'Estadísticas', icon: BarChart2 }
    ];

    const UserTableRow: React.FC<{ user: Profile }> = ({ user }) => {
        const roleInfo = USER_ROLE_MAP[user.role] || { text: 'Desconocido', color: 'secondary' };
    
        return (
            <tr className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                <td className="p-4 align-top">
                    <div className="font-semibold text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                </td>
                <td className="p-4 align-top">
                    <Badge color={roleInfo.color}>{roleInfo.text}</Badge>
                </td>
                <td className="p-4 align-top">
                    <Badge color={user.isActive ? 'success' : 'danger'}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                </td>
                <td className="p-4 align-top text-right">
                    <DropdownMenu trigger={<Button variant="secondary" className="!p-2 !bg-gray-200 !text-gray-800 hover:!bg-gray-300"><MoreVertical size={18} /></Button>}>
                        <div className="px-4 py-2 text-xs text-gray-400">Cambiar Rol a:</div>
                        {USER_ROLES.filter(r => r.id !== user.role).map(role => (
                            <DropdownMenuItem key={role.id} onClick={() => handleUpdateUser(user.id, { role: role.id })}>
                                <div className="flex items-center"><Edit className="w-4 h-4 mr-2" /> {role.name}</div>
                            </DropdownMenuItem>
                        ))}
                        <div className="border-t my-1 border-gray-200"></div>
                        {user.isActive ? (
                            <DropdownMenuItem onClick={() => openUserConfirmationModal(user, 'deactivate')}>
                                <div className="flex items-center text-red-500"><UserX className="w-4 h-4 mr-2" /> Desactivar Usuario</div>
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onClick={() => openUserConfirmationModal(user, 'activate')}>
                                <div className="flex items-center text-green-500"><UserCheck className="w-4 h-4 mr-2" /> Activar Usuario</div>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenu>
                </td>
            </tr>
        );
    };

    const BusinessTableRow: React.FC<{ business: Business }> = ({ business }) => {
        const approvalStatusMap = {
            pending: { text: 'Pendiente', color: 'warning' as const },
            approved: { text: 'Aprobado', color: 'success' as const },
            rejected: { text: 'Rechazado', color: 'danger' as const },
        };
        const approvalInfo = approvalStatusMap[business.approvalStatus || 'pending'];
    
        return (
            <tr className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                <td className="p-4 align-top">
                    <div className="flex items-center">
                        <img src={business.image} alt={business.name} className="w-10 h-10 rounded-md object-cover mr-3" />
                        <div>
                            <div className="font-semibold text-gray-900">{business.name}</div>
                            <div className="text-sm text-gray-600">{business.address}</div>
                        </div>
                    </div>
                </td>
                <td className="p-4 align-top"><Badge color="secondary">{business.category}</Badge></td>
                <td className="p-4 align-top">
                    <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1"/> {business.rating}
                    </div>
                </td>
                <td className="p-4 align-top">
                    <Badge color={business.is_open ? 'success' : 'secondary'}>{business.is_open ? 'Abierto' : 'Cerrado'}</Badge>
                </td>
                 <td className="p-4 align-top">
                    <Badge color={approvalInfo.color}>{approvalInfo.text}</Badge>
                </td>
                <td className="p-4 align-top">
                    <Badge color={business.isActive ? 'success' : 'danger'}>{business.isActive ? 'Activo' : 'Inactivo'}</Badge>
                </td>
                <td className="p-4 align-top text-right">
                    <DropdownMenu trigger={<Button variant="secondary" className="!p-2 !bg-gray-200 !text-gray-800 hover:!bg-gray-300"><MoreVertical size={18} /></Button>}>
                         {business.approvalStatus === 'pending' && (
                             <>
                                <DropdownMenuItem onClick={() => openBusinessConfirmationModal(business, 'approve')}>
                                    <div className="flex items-center text-green-500"><CheckCircle className="w-4 h-4 mr-2" /> Aprobar</div>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openBusinessConfirmationModal(business, 'reject')}>
                                    <div className="flex items-center text-red-500"><XCircle className="w-4 h-4 mr-2" /> Rechazar</div>
                                </DropdownMenuItem>
                                <div className="border-t my-1 border-gray-200"></div>
                             </>
                         )}
                         {business.approvalStatus === 'approved' && (
                             business.isActive ? (
                                <DropdownMenuItem onClick={() => openBusinessConfirmationModal(business, 'deactivate')}>
                                    <div className="flex items-center text-red-500"><UserX className="w-4 h-4 mr-2" /> Desactivar</div>
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onClick={() => openBusinessConfirmationModal(business, 'activate')}>
                                    <div className="flex items-center text-green-500"><UserCheck className="w-4 h-4 mr-2" /> Activar</div>
                                </DropdownMenuItem>
                            )
                         )}
                         <DropdownMenuItem onClick={() => { /* Implement view details */ }}>
                            <div className="flex items-center"><ClipboardList className="w-4 h-4 mr-2" /> Ver Documentos</div>
                        </DropdownMenuItem>
                    </DropdownMenu>
                </td>
            </tr>
        );
    };

    const DeliveryTableRow: React.FC<{ person: DeliveryPerson }> = ({ person }) => {
        const approvalStatusMap = {
            pending: { text: 'Pendiente', color: 'warning' as const },
            approved: { text: 'Aprobado', color: 'success' as const },
            rejected: { text: 'Rechazado', color: 'danger' as const },
        };
        const approvalInfo = approvalStatusMap[person.approvalStatus];

        return (
            <tr className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                <td className="p-4 align-top">
                    <div className="font-semibold text-gray-900">{person.name}</div>
                    <div className="text-sm text-gray-600">{person.email}</div>
                </td>
                <td className="p-4 align-top text-gray-800">{person.vehicle}</td>
                <td className="p-4 align-top">
                    <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1"/> {person.rating}
                    </div>
                </td>
                <td className="p-4 align-top">
                    <Badge color={person.is_online ? 'success' : 'secondary'}>{person.is_online ? 'En Línea' : 'Offline'}</Badge>
                </td>
                <td className="p-4 align-top">
                    <Badge color={approvalInfo.color}>{approvalInfo.text}</Badge>
                </td>
                <td className="p-4 align-top">
                    <Badge color={person.isActive ? 'success' : 'danger'}>{person.isActive ? 'Activo' : 'Inactivo'}</Badge>
                </td>
                <td className="p-4 align-top text-right">
                    <DropdownMenu trigger={<Button variant="secondary" className="!p-2 !bg-gray-200 !text-gray-800 hover:!bg-gray-300"><MoreVertical size={18} /></Button>}>
                        {person.approvalStatus === 'pending' && (
                            <>
                                <DropdownMenuItem onClick={() => openDeliveryConfirmationModal(person, 'approve')}>
                                    <div className="flex items-center text-green-500"><CheckCircle className="w-4 h-4 mr-2" /> Aprobar</div>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openDeliveryConfirmationModal(person, 'reject')}>
                                    <div className="flex items-center text-red-500"><XCircle className="w-4 h-4 mr-2" /> Rechazar</div>
                                </DropdownMenuItem>
                                <div className="border-t my-1 border-gray-200"></div>
                            </>
                        )}
                        {person.approvalStatus === 'approved' && (
                            person.isActive ? (
                                <DropdownMenuItem onClick={() => openDeliveryConfirmationModal(person, 'deactivate')}>
                                    <div className="flex items-center text-red-500"><UserX className="w-4 h-4 mr-2" /> Desactivar</div>
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onClick={() => openDeliveryConfirmationModal(person, 'activate')}>
                                    <div className="flex items-center text-green-500"><UserCheck className="w-4 h-4 mr-2" /> Activar</div>
                                </DropdownMenuItem>
                            )
                        )}
                        <DropdownMenuItem onClick={() => { /* Implement view details */ }}>
                            <div className="flex items-center"><ClipboardList className="w-4 h-4 mr-2" /> Ver Documentos</div>
                        </DropdownMenuItem>
                    </DropdownMenu>
                </td>
            </tr>
        );
    };

    const renderUserManagement = () => (
         <div className="p-4 md:p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Gestión de Usuarios</h2>
            <Card className="p-4 bg-white border border-gray-200 shadow mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o correo..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-2 pl-10 border rounded-md bg-gray-50 border-gray-300 text-gray-900 focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as UserRole | 'ALL')}
                        className="p-2 border rounded-md bg-gray-50 border-gray-300 text-gray-900 focus:ring-purple-500 focus:border-purple-500"
                    >
                        <option value="ALL">Todos los Roles</option>
                        {USER_ROLES.map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                    </select>
                </div>
            </Card>

            <Card className="overflow-x-auto bg-white border border-gray-200 shadow">
                {usersLoading ? (
                    <p className="p-8 text-center text-gray-600">Cargando usuarios...</p>
                ) : usersError ? (
                    <p className="p-8 text-center text-red-600">Error: {usersError}</p>
                ) : (
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="p-4">Usuario</th>
                                <th scope="col" className="p-4">Rol</th>
                                <th scope="col" className="p-4">Estado</th>
                                <th scope="col" className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => <UserTableRow key={user.id} user={user} />)}
                        </tbody>
                    </table>
                )}
            </Card>
        </div>
    );
    
    const renderBusinessManagement = () => (
        <div className="p-4 md:p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Gestión de Negocios</h2>
            <Card className="p-4 bg-white border border-gray-200 shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative md:col-span-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input type="text" placeholder="Buscar por nombre..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full p-2 pl-10 border rounded-md bg-gray-50 border-gray-300 text-gray-900 focus:ring-purple-500 focus:border-purple-500"/>
                    </div>
                    <select value={businessCategoryFilter} onChange={(e) => setBusinessCategoryFilter(e.target.value)} className="p-2 border rounded-md bg-gray-50 border-gray-300 text-gray-900 focus:ring-purple-500 focus:border-purple-500">
                        <option value="ALL">Todas las Categorías</option>
                        {uniqueBusinessCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                     <select value={businessApprovalFilter} onChange={(e) => setBusinessApprovalFilter(e.target.value as any)} className="p-2 border rounded-md bg-gray-50 border-gray-300 text-gray-900 focus:ring-purple-500 focus:border-purple-500">
                        <option value="ALL">Todos los Estados</option>
                        <option value="pending">Pendientes</option>
                        <option value="approved">Aprobados</option>
                        <option value="rejected">Rechazados</option>
                    </select>
                </div>
            </Card>

            <Card className="overflow-x-auto bg-white border border-gray-200 shadow">
                 {businessesLoading ? (
                    <p className="p-8 text-center text-gray-600">Cargando negocios...</p>
                ) : businessesError ? (
                    <p className="p-8 text-center text-red-600">Error: {businessesError}</p>
                ) : (
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <SortableHeader sortKey="name">Negocio</SortableHeader>
                                <SortableHeader sortKey="category">Categoría</SortableHeader>
                                <SortableHeader sortKey="rating">Rating</SortableHeader>
                                <th scope="col" className="p-4">Disponibilidad</th>
                                <th scope="col" className="p-4">Aprobación</th>
                                <th scope="col" className="p-4">Estado Activo</th>
                                <th scope="col" className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAndFilteredBusinesses.map(business => <BusinessTableRow key={business.id} business={business} />)}
                        </tbody>
                    </table>
                 )}
            </Card>
        </div>
    );

    const renderDeliveryManagement = () => (
        <div className="p-4 md:p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Gestión de Repartidores</h2>
            <Card className="p-4 bg-white border border-gray-200 shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative md:col-span-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input type="text" placeholder="Buscar por nombre o correo..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full p-2 pl-10 border rounded-md bg-gray-50 border-gray-300 text-gray-900 focus:ring-purple-500 focus:border-purple-500"/>
                    </div>
                    <select value={deliveryApprovalFilter} onChange={(e) => setDeliveryApprovalFilter(e.target.value as any)} className="p-2 border rounded-md bg-gray-50 border-gray-300 text-gray-900 focus:ring-purple-500 focus:border-purple-500">
                        <option value="ALL">Todos los Estados de Aprobación</option>
                        <option value="pending">Pendientes</option>
                        <option value="approved">Aprobados</option>
                        <option value="rejected">Rechazados</option>
                    </select>
                    <select value={deliveryOnlineFilter} onChange={(e) => setDeliveryOnlineFilter(e.target.value as any)} className="p-2 border rounded-md bg-gray-50 border-gray-300 text-gray-900 focus:ring-purple-500 focus:border-purple-500">
                        <option value="ALL">Todos los Estados de Conexión</option>
                        <option value="ONLINE">En Línea</option>
                        <option value="OFFLINE">Desconectado</option>
                    </select>
                </div>
            </Card>

            <Card className="overflow-x-auto bg-white border border-gray-200 shadow">
                {deliveryLoading ? (
                    <p className="p-8 text-center text-gray-600">Cargando repartidores...</p>
                ) : deliveryError ? (
                    <p className="p-8 text-center text-red-600">Error: {deliveryError}</p>
                ) : (
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <SortableHeader sortKey="name">Repartidor</SortableHeader>
                                <SortableHeader sortKey="vehicle">Vehículo</SortableHeader>
                                <SortableHeader sortKey="rating">Rating</SortableHeader>
                                <th scope="col" className="p-4">En Línea</th>
                                <th scope="col" className="p-4">Aprobación</th>
                                <th scope="col" className="p-4">Estado Activo</th>
                                <th scope="col" className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAndFilteredDeliveryPeople.map(person => <DeliveryTableRow key={person.id} person={person} />)}
                        </tbody>
                    </table>
                )}
            </Card>
        </div>
    );

    const renderStatistics = () => (
        <div className="p-4 md:p-8 text-gray-800">
            <h2 className="text-3xl font-bold mb-6">Estadísticas de la Plataforma</h2>
            
            <Card className="p-4 bg-white border border-gray-200 shadow mb-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                        <input type="date" value={statsDateRange.start} onChange={e => setStatsDateRange(prev => ({...prev, start: e.target.value}))} className="w-full p-2 border rounded-md bg-gray-50 border-gray-300 text-gray-900 focus:ring-purple-500 focus:border-purple-500" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                        <input type="date" value={statsDateRange.end} onChange={e => setStatsDateRange(prev => ({...prev, end: e.target.value}))} className="w-full p-2 border rounded-md bg-gray-50 border-gray-300 text-gray-900 focus:ring-purple-500 focus:border-purple-500" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Negocio</label>
                        <select value={statsBusinessId} onChange={e => setStatsBusinessId(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 border-gray-300 text-gray-900 focus:ring-purple-500 focus:border-purple-500">
                            <option value="ALL">Todos los Negocios</option>
                            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Repartidor</label>
                        <select value={statsDeliveryId} onChange={e => setStatsDeliveryId(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 border-gray-300 text-gray-900 focus:ring-purple-500 focus:border-purple-500">
                             <option value="ALL">Todos los Repartidores</option>
                             {deliveryPeople.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                 </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatsCard title="Ingresos Totales (Entregados)" value={`$${statsKPIs.totalRevenue.toLocaleString('es-MX', {minimumFractionDigits: 2})}`} icon={<DollarSign size={28} className="text-white"/>} iconBgColor="#00A88B" className="bg-gradient-to-br from-[#1A0129] to-[#2C0054]" />
                <StatsCard title="Pedidos Totales" value={statsKPIs.totalOrders.toLocaleString()} icon={<ClipboardList size={28} className="text-white"/>} iconBgColor="#3F7FBF" className="bg-gradient-to-br from-[#1A0129] to-[#2C0054]" />
                <StatsCard title="Valor Promedio Pedido" value={`$${statsKPIs.avgOrderValue.toLocaleString('es-MX', {minimumFractionDigits: 2})}`} icon={<Activity size={28} className="text-white"/>} iconBgColor="#9B51E0" className="bg-gradient-to-br from-[#1A0129] to-[#2C0054]" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <Card className="p-6 bg-white border border-gray-200 shadow">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">Pedidos a lo Largo del Tiempo</h3>
                    {ordersByDay.length > 1 ? <OrdersOverTimeChart data={ordersByDay} /> : <p className="text-center text-gray-500 h-64 flex items-center justify-center">No hay suficientes datos para mostrar un gráfico.</p>}
                </Card>
                 <Card className="p-6 bg-white border border-gray-200 shadow">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">Top 5 Negocios por Pedidos</h3>
                     {topBusinessesByOrders.length > 0 ? <TopItemsChart data={topBusinessesByOrders} /> : <p className="text-center text-gray-500 h-64 flex items-center justify-center">No hay datos de negocios.</p>}
                </Card>
                 <Card className="p-6 bg-white border border-gray-200 shadow">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">Top 5 Repartidores por Entregas</h3>
                     {topDeliveryByOrders.length > 0 ? <TopItemsChart data={topDeliveryByOrders} /> : <p className="text-center text-gray-500 h-64 flex items-center justify-center">No hay datos de repartidores.</p>}
                </Card>
            </div>
        </div>
    );


    const renderContent = () => {
        // Reset filters when switching views
        useEffect(() => {
            setSearchQuery('');
            setRoleFilter('ALL');
            setBusinessCategoryFilter('ALL');
            setBusinessApprovalFilter('ALL');
            setDeliveryApprovalFilter('ALL');
            setDeliveryOnlineFilter('ALL');
            setSortConfig({ key: 'name', direction: 'ascending' });
            setStatsDateRange({ start: '', end: '' });
            setStatsBusinessId('ALL');
            setStatsDeliveryId('ALL');
        }, [currentView]);

        switch (currentView) {
            case 'overview':
                 return (
                    <div className="p-4 md:p-8 text-gray-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                            <StatsCard title="Total Usuarios" value={users.length.toString()} icon={<Users size={28} className="text-white"/>} iconBgColor="#3F7FBF" className="bg-gradient-to-br from-[#1A0129] to-[#2C0054]" />
                            <StatsCard title="Total Negocios" value={businesses.length.toString()} icon={<Briefcase size={28} className="text-white"/>} iconBgColor="#F2994A" className="bg-gradient-to-br from-[#1A0129] to-[#2C0054]" />
                            <StatsCard title="Total Repartidores" value={deliveryPeople.length.toString()} icon={<Bike size={28} className="text-white"/>} iconBgColor="#00A88B" className="bg-gradient-to-br from-[#1A0129] to-[#2C0054]" />
                            <StatsCard title="Pedidos en Curso" value={liveOrders.length.toString()} icon={<Activity size={28} className="text-white"/>} iconBgColor="#9B51E0" className="bg-gradient-to-br from-[#1A0129] to-[#2C0054]" />
                            <StatsCard title="Pedidos Totales" value={allOrders.length.toString()} icon={<ClipboardList size={28} className="text-white"/>} iconBgColor="#EB5757" className="bg-gradient-to-br from-[#1A0129] to-[#2C0054]" />
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Mapa de Actividad en Vivo</h2>
                        <Card className="h-[600px] overflow-hidden bg-white border border-gray-200 shadow">
                            <MapContainer center={[MOCK_USER_LOCATION.lat, MOCK_USER_LOCATION.lng]} zoom={13} scrollWheelZoom={false} className="h-full w-full">
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'/>
                                {liveOrders.map(order => (
                                    <React.Fragment key={order.id}>
                                        {order.business?.location && <Marker position={[order.business.location.lat, order.business.location.lng]} icon={iconBusiness}><Popup>{order.business.name} (Negocio)</Popup></Marker>}
                                        {order.delivery_person?.location && <Marker position={[order.delivery_person.location.lat, order.delivery_person.location.lng]} icon={iconDelivery}><Popup>{order.delivery_person.name} (Repartidor)</Popup></Marker>}
                                    </React.Fragment>
                                ))}
                            </MapContainer>
                        </Card>
                    </div>
                );
            case 'users':
                return renderUserManagement();
            case 'businesses':
                return renderBusinessManagement();
            case 'delivery':
                return renderDeliveryManagement();
            case 'statistics':
                return renderStatistics();
            default:
                return null;
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex">
             <aside className="w-64 bg-[#1A0129] text-white flex flex-col">
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-2xl font-bold">{APP_NAME}</h1>
                    <span className="text-sm text-purple-300">Panel de Admin</span>
                </div>
                <nav className="flex-grow p-4">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setCurrentView(item.id as AdminView)}
                                className={`w-full flex items-center p-3 my-1 rounded-lg text-left transition-colors ${
                                currentView === item.id ? 'bg-purple-800' : 'hover:bg-purple-900/50'
                                }`}
                            >
                                <Icon className="w-5 h-5 mr-3" />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-white/10">
                    <p className="text-sm">Iniciaste sesión como</p>
                    <p className="font-semibold truncate">{user.name}</p>
                    <Button onClick={onLogout} variant="secondary" className="w-full mt-4">Cerrar Sesión</Button>
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto">
                {renderContent()}
            </main>
            <ConfirmationModal
                isOpen={userModalState.isOpen}
                onClose={() => setUserModalState({ isOpen: false, user: null, action: null })}
                onConfirm={handleConfirmUserAction}
                title={`Confirmar ${userModalState.action === 'activate' ? 'Activación' : 'Desactivación'}`}
                message={`¿Estás seguro de que quieres ${userModalState.action === 'activate' ? 'activar' : 'desactivar'} a ${userModalState.user?.name}?`}
                confirmText={`Sí, ${userModalState.action === 'activate' ? 'Activar' : 'Desactivar'}`}
            />
            <ConfirmationModal
                isOpen={businessModalState.isOpen}
                onClose={() => setBusinessModalState({ isOpen: false, business: null, action: null })}
                onConfirm={handleConfirmBusinessAction}
                title={`Confirmar Acción`}
                message={`¿Estás seguro de que quieres ${businessModalState.action} el negocio ${businessModalState.business?.name}?`}
                confirmText={`Sí, ${businessModalState.action}`}
            />
            <ConfirmationModal
                isOpen={deliveryModalState.isOpen}
                onClose={() => setDeliveryModalState({ isOpen: false, person: null, action: null })}
                onConfirm={handleConfirmDeliveryAction}
                title="Confirmar Acción"
                message={`¿Estás seguro de que quieres ${deliveryModalState.action} a ${deliveryModalState.person?.name}?`}
                confirmText={`Sí, ${deliveryModalState.action}`}
            />
        </div>
    );
};

export default AdminDashboard;