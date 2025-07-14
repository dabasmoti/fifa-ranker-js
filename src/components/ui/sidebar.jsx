import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);
  return (
    <SidebarContext.Provider value={{ isOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);

export const Sidebar = ({ children, className = "" }) => {
  const { isOpen, toggle } = useSidebar();
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggle} // Close sidebar when clicking overlay
        />
      )}
      {/* Sidebar */}
      <aside className={`
        fixed md:relative 
        top-0 left-0 
        h-full md:h-auto
        w-64 
        z-50 md:z-auto
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${className}
      `}>
        {children}
      </aside>
    </>
  );
};

export const SidebarTrigger = ({ children, className = "" }) => {
  const { toggle } = useSidebar();
  return (
    <button onClick={toggle} className={`md:hidden ${className}`}>
      {children}
    </button>
  );
};

export const SidebarHeader = ({ children, className = "" }) => <header className={className}>{children}</header>;
export const SidebarContent = ({ children, className = "" }) => <div className={className}>{children}</div>;
export const SidebarGroup = ({ children, className = "" }) => <div className={className}>{children}</div>;
export const SidebarGroupLabel = ({ children, className = "" }) => <h3 className={className}>{children}</h3>;
export const SidebarGroupContent = ({ children, className = "" }) => <div className={className}>{children}</div>;
export const SidebarMenu = ({ children, className = "" }) => <ul className={className}>{children}</ul>;
export const SidebarMenuItem = ({ children, className = "" }) => <li className={className}>{children}</li>;

export const SidebarMenuButton = ({ children, asChild, className = "" }) => {
  if (asChild) {
    return React.cloneElement(children, {
      className: `${children.props.className || ''} ${className}`.trim(),
    });
  }
  return <button className={className}>{children}</button>;
}; 