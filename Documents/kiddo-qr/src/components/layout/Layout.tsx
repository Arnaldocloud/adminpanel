import React from 'react';
import Navbar from '../common/Navbar';
import { SidebarProvider } from '@/components/ui/sidebar';
import Sidebar from './Sidebar';
import { AuthProvider } from '@/components/auth/AuthProvider';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <AuthProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-kiddo-gray">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Navbar />
            <main className="flex-1 flex items-center justify-center px-2 sm:px-4 md:px-6 py-4 md:py-6 max-w-[1200px] mx-auto">
              <div className="w-full">
                {children}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AuthProvider>
  );
};

export default Layout;
