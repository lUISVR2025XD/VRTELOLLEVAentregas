import React from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor: string;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, icon, iconBgColor, className = '' }) => {
  return (
    <div className={`p-5 rounded-2xl flex items-center justify-between ${className}`}>
      <div>
        <p className="text-sm text-gray-300">{title}</p>
        <p className="text-4xl font-bold">{value}</p>
        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl`} style={{ backgroundColor: iconBgColor }}>
        {icon}
      </div>
    </div>
  );
};

export default StatsCard;
