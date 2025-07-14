import React, { createContext, useContext, useState } from 'react';

const DialogContext = createContext();

export const Dialog = ({ children, open, onOpenChange }) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={() => onOpenChange?.(false)}
          />
          <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            {children}
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};

export const DialogTrigger = ({ children, asChild }) => {
  const { onOpenChange } = useContext(DialogContext);
  
  if (asChild) {
    return React.cloneElement(children, {
      onClick: () => onOpenChange?.(true)
    });
  }
  
  return (
    <button onClick={() => onOpenChange?.(true)}>
      {children}
    </button>
  );
};

export const DialogContent = ({ children, className = "" }) => {
  const { open } = useContext(DialogContext);
  
  if (!open) return null;
  
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
};

export const DialogHeader = ({ children, className = "" }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

export const DialogTitle = ({ children, className = "" }) => (
  <h2 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h2>
);

export const DialogDescription = ({ children, className = "" }) => (
  <p className={`text-sm text-gray-600 mt-1 ${className}`}>
    {children}
  </p>
);

export const DialogFooter = ({ children, className = "" }) => (
  <div className={`flex justify-end gap-3 mt-6 ${className}`}>
    {children}
  </div>
);

export const DialogClose = ({ children, asChild }) => {
  const { onOpenChange } = useContext(DialogContext);
  
  if (asChild) {
    return React.cloneElement(children, {
      onClick: () => onOpenChange?.(false)
    });
  }
  
  return (
    <button onClick={() => onOpenChange?.(false)}>
      {children}
    </button>
  );
}; 