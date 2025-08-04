
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8">
        <h1 className="text-9xl font-bold text-kiddo-blue mb-4">404</h1>
        <p className="text-2xl text-gray-600 mb-6">Página no encontrada</p>
        <p className="text-gray-500 mb-8">
          La ruta <span className="font-mono bg-gray-200 px-2 py-1 rounded">{location.pathname}</span> no existe.
        </p>
        <Link to="/">
          <Button className="bg-kiddo-blue hover:bg-blue-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Inicio
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
