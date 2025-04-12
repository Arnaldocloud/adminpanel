import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, QrCode, Calendar, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';

const Sidebar = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Estudiantes', path: '/students' },
    { icon: QrCode, label: 'Escáner QR', path: '/' },
    { icon: QrCode, label: 'Códigos QR', path: '/qrcodes' },
    { icon: Calendar, label: 'Asistencias', path: '/attendance' },
    { icon: Settings, label: 'Configuración', path: '/settings' },
  ];

  return (
    <SidebarComponent>
      <SidebarHeader className="flex h-16 items-center px-3 sm:px-4">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-kiddo-blue p-1">
            <QrCode className="h-6 w-6 text-white" />
          </div>
          <span className="text-lg font-bold text-kiddo-blue">Kiddo QR</span>
        </div>
        <SidebarTrigger className="ml-auto sm:hidden" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.path}
                      className={({ isActive }) => 
                        isActive ? "text-kiddo-blue font-medium flex items-center gap-2 sm:gap-3" 
                               : "text-kiddo-darkgray hover:text-kiddo-blue flex items-center gap-2 sm:gap-3"
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarFooter>
          <div className="p-3 sm:p-4">
            <button 
              className="flex w-full items-center gap-2 sm:gap-3 rounded-md px-2 sm:px-3 py-2 text-red-500 transition-colors hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </SidebarFooter>
      </SidebarContent>
    </SidebarComponent>
  );
};

export default Sidebar;
