
import React, { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
  bodyClassName?: string;
  actions?: ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children, className = '', titleClassName = '', bodyClassName = '', actions }) => {
  return (
    <div className={`bg-white shadow-lg rounded-lg overflow-hidden ${className}`}>
      {title && (
        <div className={`p-4 border-b border-neutral-200 flex justify-between items-center ${titleClassName}`}>
          <h3 className="text-md font-semibold text-neutral-700">{title}</h3>
          {actions}
        </div>
      )}
      <div className={`p-4 ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default Card;