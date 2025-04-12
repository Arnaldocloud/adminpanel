
import React from 'react';
import Layout from '@/components/layout/Layout';

const Settings = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Configuración</h2>
          <p className="text-muted-foreground">Administra la configuración del sistema</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-medium mb-4">Configuración General</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nombre de la Institución</label>
                <input 
                  type="text" 
                  className="w-full rounded-md border px-3 py-2"
                  defaultValue="Escuela Demo"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Zona Horaria</label>
                <select className="w-full rounded-md border px-3 py-2">
                  <option>(GMT-05:00) Eastern Time (US & Canada)</option>
                  <option>(GMT-06:00) Central Time (US & Canada)</option>
                  <option>(GMT-07:00) Mountain Time (US & Canada)</option>
                  <option>(GMT-08:00) Pacific Time (US & Canada)</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-medium mb-4">Notificaciones</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Notificaciones WhatsApp</h4>
                  <p className="text-sm text-muted-foreground">Enviar alertas por WhatsApp</p>
                </div>
                <div className="h-6 w-11 rounded-full bg-gray-200 relative">
                  <input 
                    type="checkbox" 
                    className="sr-only"
                    id="whatsapp-toggle"
                    defaultChecked
                  />
                  <label 
                    htmlFor="whatsapp-toggle"
                    className="flex h-6 w-11 cursor-pointer rounded-full bg-kiddo-blue items-center"
                  >
                    <span className="h-5 w-5 rounded-full bg-white transform translate-x-5"></span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Plantilla de Mensaje</label>
                <textarea 
                  className="w-full rounded-md border px-3 py-2 min-h-[100px]"
                  defaultValue="Buen día. Su representado *[NOMBRE]* asistió hoy [FECHA] a las [HORA].\n– Sistema Kiddo QR Attend"
                ></textarea>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-medium mb-4">Seguridad</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Contraseña Actual</label>
                <input 
                  type="password" 
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Nueva Contraseña</label>
                <input 
                  type="password" 
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Confirmar Nueva Contraseña</label>
                <input 
                  type="password" 
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>
              
              <button className="rounded-md bg-kiddo-blue px-4 py-2 text-white">
                Actualizar Contraseña
              </button>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-medium mb-4">Información de Cuenta</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Plan Actual</label>
                <p className="font-medium">Plan Básico</p>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Fecha de Renovación</label>
                <p>15 de Mayo, 2025</p>
              </div>
              
              <button className="rounded-md border border-kiddo-blue px-4 py-2 text-kiddo-blue">
                Actualizar Plan
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button className="rounded-md bg-kiddo-blue px-6 py-2 text-white">
            Guardar Cambios
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
