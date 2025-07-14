import React from 'react';

export const Badge = ({ children, className, ...props }) => (
  <span
    className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 ${className}`}
    {...props}
  >
    {children}
  </span>
); 