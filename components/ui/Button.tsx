import React from 'react';

// FIX: Added 'as' and 'htmlFor' props to support rendering as a label, resolving type errors.
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  as?: React.ElementType;
  htmlFor?: string;
}

const Button: React.FC<ButtonProps> = ({ children, className = '', variant = 'primary', as: Component = 'button', ...props }) => {
  const baseClasses = "px-4 py-2 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50";
  
  const variantClasses = {
    primary: 'bg-white/20 text-white hover:bg-white/30 focus:ring-purple-400 border border-white/30',
    secondary: 'bg-white/10 text-white hover:bg-white/20 focus:ring-purple-400 border border-white/20',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  return (
    <Component className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </Component>
  );
};

export default Button;
