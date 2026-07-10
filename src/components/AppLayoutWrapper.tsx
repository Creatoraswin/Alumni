"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/useAuth';

type SidebarContextType = {
  isSidebarExpanded: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType>({
  isSidebarExpanded: true,
  toggleSidebar: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export const AppLayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn } = useAuth();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const toggleSidebar = () => setIsSidebarExpanded(!isSidebarExpanded);

  // If not logged in, there is no sidebar padding
  // If logged in and expanded, padding is 64 (16rem / 256px)
  // If logged in and collapsed, padding is 20 (5rem / 80px)
  const paddingClass = isLoggedIn 
    ? (isSidebarExpanded ? 'lg:pl-64' : 'lg:pl-20') 
    : '';

  return (
    <SidebarContext.Provider value={{ isSidebarExpanded, toggleSidebar }}>
      <div className={`flex-1 flex flex-col transition-all duration-300 w-full ${paddingClass}`}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
};
