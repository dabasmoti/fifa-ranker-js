import React from 'react';

export const Progress = ({ value = 0, className, ...props }) => {
  const percentage = Math.min(Math.max(value, 0), 100);
  
  return (
    <div
      className={`relative w-full bg-gray-200 rounded-full h-2 overflow-hidden ${className}`}
      {...props}
    >
      <div
        className="h-full bg-blue-600 transition-all duration-300 ease-in-out rounded-full"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}; 