import React from 'react';
import { Bell, Search } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';

const Navbar = () => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center border-b bg-background px-4 md:px-6">
      <SidebarTrigger className="mr-2 md:hidden" />
      
      <div className="ml-auto flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar..."
            className="rounded-md border border-input bg-background px-8 py-2 text-sm"
          />
        </div>
        
        <button className="relative rounded-full p-2 hover:bg-accent">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-kiddo-pink"></span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
