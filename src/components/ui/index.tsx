import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  headerAction?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, headerAction }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col ${className}`}>
    {(title || headerAction) && (
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center gap-2">
        {title && <h3 className="font-bold text-slate-700 text-sm sm:text-base truncate">{title}</h3>}
        {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
      </div>
    )}
    <div className="p-3 flex-1">{children}</div>
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'whatsapp' | 'ghost' | 'outline';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const base = "py-2 px-3 sm:py-2.5 sm:px-4 font-semibold rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg",
    secondary: "bg-slate-200 hover:bg-slate-300 text-slate-700",
    whatsapp: "bg-whatsapp hover:bg-green-600 text-white shadow-md hover:shadow-lg",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600 border border-slate-200",
    outline: "bg-transparent hover:bg-slate-50 text-slate-700 border border-slate-300",
  };

  return (
    <button 
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => (
  <div className="space-y-1 w-full">
    {label && <label className="block text-sm font-medium text-slate-600">{label}</label>}
    <input 
      className={`w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${className}`}
      {...props}
    />
  </div>
);

export * from './Table';
export * from './Tabs';
