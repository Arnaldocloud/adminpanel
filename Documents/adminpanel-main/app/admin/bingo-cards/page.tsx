'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PurchaseOrdersTable } from '@/components/admin/PurchaseOrdersTable';

export default function BingoCardsPage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
      </div>

      <Tabs defaultValue="purchases" className="w-full">
        <TabsList>
          <TabsTrigger value="purchases">Órdenes de Compra</TabsTrigger>
          <TabsTrigger value="cards">Gestión de Cartones</TabsTrigger>
        </TabsList>
        
        <TabsContent value="purchases" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Órdenes de Compra</CardTitle>
            </CardHeader>
            <CardContent>
              <PurchaseOrdersTable />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cards" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Cartones</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Aquí podrás gestionar los cartones de bingo.</p>
              {/* Agregar aquí la gestión de cartones en el futuro */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}