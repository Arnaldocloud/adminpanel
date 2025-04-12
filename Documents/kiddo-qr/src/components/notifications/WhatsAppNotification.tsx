
import React, { useState } from 'react';
import { Send, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Student {
  id: string;
  name: string;
  parent: string;
  phone: string;
}

interface WhatsAppNotificationProps {
  student?: Student;
  timestamp?: Date;
  autoSend?: boolean;
}

const WhatsAppNotification = ({ 
  student = {
    id: "123",
    name: "Carlos Pérez",
    parent: "Juan Pérez",
    phone: "+584141234567"
  },
  timestamp = new Date(),
  autoSend = false 
}: WhatsAppNotificationProps) => {
  const [notificationSent, setNotificationSent] = useState(false);
  const [isAutoNotify, setIsAutoNotify] = useState(autoSend);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long'
    });
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };
  
  const generateMessage = () => {
    return encodeURIComponent(
      `Buen día. Su representado *${student.name}* asistió hoy ${formatDate(timestamp)} a las ${formatTime(timestamp)}.\n– Sistema Kiddo QR Assist`
    );
  };
  
  const handleSendNotification = () => {
    // In a real implementation, this would send the message through an API
    setNotificationSent(true);
    
    // Simulate API call success
    setTimeout(() => {
      setNotificationSent(false);
    }, 2000);
  };
  
  const handleOpenWhatsApp = () => {
    const url = `https://wa.me/${student.phone}?text=${generateMessage()}`;
    window.open(url, '_blank');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Notificación WhatsApp</span>
          <div className="flex items-center space-x-2">
            <Switch 
              id="auto-notify" 
              checked={isAutoNotify} 
              onCheckedChange={setIsAutoNotify} 
            />
            <Label htmlFor="auto-notify">Auto notificar</Label>
          </div>
        </CardTitle>
        <CardDescription>
          Envía notificaciones a los representantes cuando sus hijos registran asistencia
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-green-50 p-4 rounded-md border border-green-200">
          <p className="text-sm text-gray-700 whitespace-pre-line">
            Buen día. Su representado <span className="font-semibold">{student.name}</span> asistió hoy {formatDate(timestamp)} a las {formatTime(timestamp)}.
            <br />– Sistema Kiddo QR Assist
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button 
          variant="outline" 
          onClick={handleOpenWhatsApp}
        >
          Abrir WhatsApp
          <Send className="ml-2 h-4 w-4" />
        </Button>
        <Button 
          onClick={handleSendNotification}
          disabled={notificationSent}
          className="bg-green-600 hover:bg-green-700"
        >
          {notificationSent ? (
            <>
              <span>Enviado</span>
              <Check className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              <span>Enviar</span>
              <Send className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WhatsAppNotification;
