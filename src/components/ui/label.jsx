import React from 'react';

export const Label = ({ children, className, ...props }) => (
  <label
    className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}
    {...props}
  >
    {children}
  </label>
); 