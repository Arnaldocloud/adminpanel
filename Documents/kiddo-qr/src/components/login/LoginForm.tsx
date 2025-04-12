
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, School, QrCode } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login process
    setTimeout(() => {
      setIsLoading(false);
      
      // For demo purposes, allow any login
      toast({
        title: "¡Inicio de sesión exitoso!",
        description: "Bienvenido al sistema de asistencia Kiddo QR",
      });
      
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-2 rounded-xl bg-kiddo-blue">
            <QrCode size={40} className="text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl">Kiddo QR Attend</CardTitle>
        <CardDescription>
          Inicia sesión para acceder al sistema de control de asistencia
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="tu@escuela.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="school">Institución</Label>
            <div className="relative">
              <School className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                id="school"
                placeholder="Nombre de la institución"
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button
            type="submit"
            className="w-full bg-kiddo-blue hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <a href="#" className="underline hover:text-kiddo-blue">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default LoginForm;
