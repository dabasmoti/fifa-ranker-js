import React from 'react';

const getVariantStyles = (variant) => {
  switch (variant) {
    case 'success':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'destructive':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'secondary':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'outline':
      return 'bg-transparent border border-gray-300 text-gray-700';
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200';
  }
};

export const Badge = ({ children, className = '', variant = 'default', ...props }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getVariantStyles(variant)} ${className}`}
    {...props}
  >
    {children}
  </span>
); 