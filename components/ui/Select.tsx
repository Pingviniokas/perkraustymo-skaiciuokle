
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
  containerClassName?: string;
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({ label, id, error, options, containerClassName = 'mb-4', className, placeholder, ...props }) => {
  const baseStyles = 'mt-1 block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-neutral-500 focus:border-neutral-500 sm:text-sm rounded-md bg-white shadow-sm';
  const errorStyles = 'border-red-500 focus:ring-red-500 focus:border-red-500';
  
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={id || props.name} className="block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <select
        id={id || props.name}
        className={`${baseStyles} ${error ? errorStyles : ''} ${className}`}
        {...props}
      >
        {placeholder && <option value="" disabled={!props.value} selected={!props.value}>{placeholder}</option>}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default Select;