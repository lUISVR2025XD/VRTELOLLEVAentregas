
import React, { useState, useEffect, useRef } from 'react';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={toggleDropdown} className="cursor-pointer">{trigger}</div>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-700">
          {React.Children.map(children, child => 
            React.isValidElement(child) 
              // FIX: Cast `child.props` to correctly handle optional `onClick` property on children, resolving a type error where `child.props` was inferred as `unknown`.
              ? React.cloneElement(child, { onClick: () => { setIsOpen(false); (child.props as { onClick?: () => void }).onClick?.(); } } as any)
              : child
          )}
        </div>
      )}
    </div>
  );
};

interface DropdownMenuItemProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ children, onClick, className='' }) => {
  return (
    <a
      href="#"
      onClick={(e) => { e.preventDefault(); onClick?.(); }}
      className={`block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${className}`}
    >
      {children}
    </a>
  );
};

export default DropdownMenu;