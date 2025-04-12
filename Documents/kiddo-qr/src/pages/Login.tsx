import { useContext } from 'react';
import { AuthContext } from '@/components/auth/AuthProvider';
import LoginForm from '@/components/login/LoginForm';
import { QrCode } from 'lucide-react';


const Login = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side with illustration/branding */}
      <div className="hidden md:flex flex-col md:w-1/2 bg-kiddo-blue p-10 text-white justify-center items-center">
        <div className="mb-8 p-4 bg-white/10 rounded-xl">
          <QrCode size={80} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Kiddo QR Attend</h1>
        <p className="text-xl mb-6">Sistema de control de asistencia escolar con códigos QR</p>
        <div className="space-y-4 max-w-md">
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span>Registro rápido y seguro de asistencia</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span>Notificaciones a representantes por WhatsApp</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span>Reportes y estadísticas detalladas</span>
          </div>
        </div>
      </div>
      
      {/* Right side with login form */}
      <div className="flex-1 flex justify-center items-center p-6 bg-gray-50">
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
