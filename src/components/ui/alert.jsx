import React from 'react';

const getVariantStyles = (variant) => {
  switch (variant) {
    case 'destructive':
      return 'border-red-200 bg-red-50 text-red-800';
    case 'warning':
      return 'border-yellow-200 bg-yellow-50 text-yellow-800';
    case 'success':
      return 'border-green-200 bg-green-50 text-green-800';
    default:
      return 'border-gray-200 bg-gray-50 text-gray-800';
  }
};

export const Alert = ({ children, className = "", variant = "default", ...props }) => (
  <div
    role="alert"
    className={`
      relative w-full rounded-lg border p-4 
      [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] 
      [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground
      ${getVariantStyles(variant)}
      ${className}
    `.trim()}
    {...props}
  >
    {children}
  </div>
);

export const AlertDescription = ({ children, className = "", ...props }) => (
  <div className={`text-sm [&_p]:leading-relaxed ${className}`} {...props}>
    {children}
  </div>
); 