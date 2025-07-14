import React from 'react';

const getVariantStyles = (variant) => {
  switch (variant) {
    case 'secondary':
      return 'bg-gray-200 text-gray-900 hover:bg-gray-300';
    case 'ghost':
      return 'bg-transparent text-gray-700 hover:bg-gray-100';
    case 'destructive':
      return 'bg-red-600 text-white hover:bg-red-700';
    case 'outline':
      return 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50';
    default:
      return 'bg-blue-600 text-white hover:bg-blue-700';
  }
};

const getSizeStyles = (size) => {
  switch (size) {
    case 'sm':
      return 'px-3 py-1.5 text-sm';
    case 'lg':
      return 'px-6 py-3 text-lg';
    case 'icon':
      return 'p-2 w-10 h-10';
    default:
      return 'px-4 py-2';
  }
};

export const Button = ({ children, className = "", variant = "default", size = "default", ...props }) => (
  <button
    className={`
      rounded-md font-medium transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
      disabled:opacity-50 disabled:cursor-not-allowed
      ${getVariantStyles(variant)}
      ${getSizeStyles(size)}
      ${className}
    `.trim()}
    {...props}
  >
    {children}
  </button>
); 