
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  labelClassName?: string;
}

const Input: React.FC<InputProps> = ({ label, id, error, containerClassName = 'mb-4', className, labelClassName, ...props }) => {
  const baseStyles = 'mt-1 block w-full px-3 py-2 bg-white border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-neutral-500 focus:border-neutral-500 sm:text-sm';
  const errorStyles = 'border-red-500 focus:ring-red-500 focus:border-red-500';

  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={id || props.name} className={`block text-sm font-medium text-neutral-700 ${labelClassName || ''}`}>
          {label}
        </label>
      )}
      <input
        id={id || props.name}
        className={`${baseStyles} ${error ? errorStyles : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default Input;