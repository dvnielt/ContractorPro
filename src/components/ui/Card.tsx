import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  animate?: boolean;
}

export function Card({ children, className = '', onClick, hoverable = false, animate = false }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-slate-900 rounded-xl border border-slate-800 p-4
        transition-all duration-200
        ${hoverable ? 'hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-900/20 hover:-translate-y-0.5 cursor-pointer card-glow' : ''}
        ${onClick && !hoverable ? 'cursor-pointer hover:border-slate-700' : ''}
        ${animate ? 'animate-fade-in' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps { children: ReactNode; className?: string }
export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

interface CardTitleProps { children: ReactNode; className?: string }
export function CardTitle({ children, className = '' }: CardTitleProps) {
  return <h3 className={`text-lg font-semibold text-slate-100 ${className}`}>{children}</h3>;
}

interface CardContentProps { children: ReactNode; className?: string }
export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={className}>{children}</div>;
}
