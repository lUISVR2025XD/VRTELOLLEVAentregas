
import React from 'react';

type BadgeColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning';

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, color = 'primary', className = '' }) => {
  const colorClasses: { [key in BadgeColor]: string } = {
    primary: 'bg-blue-500/20 text-blue-300',
    secondary: 'bg-gray-500/20 text-gray-300',
    success: 'bg-green-500/20 text-green-300',
    danger: 'bg-red-500/20 text-red-300',
    warning: 'bg-yellow-500/20 text-yellow-300',
  };

  const baseClasses = "px-2.5 py-0.5 rounded-full text-xs font-semibold inline-block";

  return (
    <span className={`${baseClasses} ${colorClasses[color]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
