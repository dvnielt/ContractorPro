import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:   'bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 disabled:bg-blue-900 disabled:text-blue-500 shadow-sm shadow-blue-900/50',
  secondary: 'bg-slate-700 text-slate-100 hover:bg-slate-600 active:bg-slate-800 disabled:bg-slate-800 disabled:text-slate-500',
  danger:    'bg-red-600 text-white hover:bg-red-500 active:bg-red-700 disabled:bg-red-900 disabled:text-red-400 shadow-sm shadow-red-900/50',
  ghost:     'bg-transparent text-slate-300 hover:bg-slate-800 active:bg-slate-700 disabled:text-slate-600',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        rounded-lg font-medium
        transition-all duration-150
        active:scale-[0.97]
        min-h-[44px] min-w-[44px]
        disabled:cursor-not-allowed disabled:active:scale-100
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
