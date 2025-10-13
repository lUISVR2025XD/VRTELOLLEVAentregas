import React from 'react';
import { ShoppingCart, LogOut, ClipboardList, Menu, User } from 'lucide-react';
import { APP_NAME } from '../../constants';
import DropdownMenu, { DropdownMenuItem } from '../ui/DropdownMenu';

interface DashboardHeaderProps {
  userName: string;
  onLogout: () => void;
  cartItemCount?: number;
  onCartClick?: () => void;
  onHistoryClick?: () => void;
  onProfileClick?: () => void;
  title?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName, onLogout, cartItemCount, onCartClick, onHistoryClick, onProfileClick, title }) => {
  return (
    <header className="bg-gradient-to-b from-[#2C0054] to-[#1A0129] p-4 md:px-8 flex justify-between items-center sticky top-0 z-40 border-b border-white/10">
      <h1 className="text-3xl font-bold tracking-wider">{title || APP_NAME}</h1>
      <div className="flex items-center gap-2 md:gap-4">
        {onProfileClick && (
            <button onClick={onProfileClick} className="relative p-2 rounded-full hover:bg-white/10" title="Mi Perfil">
                <User className="h-6 w-6" />
            </button>
        )}
        {onHistoryClick && (
            <button onClick={onHistoryClick} className="relative p-2 rounded-full hover:bg-white/10" title="Historial de Pedidos">
                <ClipboardList className="h-6 w-6" />
            </button>
        )}
        {onCartClick && (
          <button onClick={onCartClick} className="relative p-2 rounded-full hover:bg-white/10" title="Carrito de Compras">
            <ShoppingCart className="h-6 w-6" />
            {cartItemCount !== undefined && cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center border-2 border-[#1A0129]">
                {cartItemCount}
              </span>
            )}
          </button>
        )}
         <DropdownMenu
          trigger={
            <button className="p-2 rounded-full hover:bg-white/10">
              <Menu className="h-6 w-6" />
            </button>
          }
        >
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Sesión iniciada como</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{userName}</p>
          </div>
          <DropdownMenuItem onClick={onLogout}>
            <div className="flex items-center text-red-500 dark:text-red-400">
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </div>
          </DropdownMenuItem>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;