import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Camera } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

declare class Html5QrcodeScanner {
  constructor(
    elementId: string,
    config: {
      fps?: number;
      qrbox?: { width: number; height: number };
      aspectRatio?: number;
      qrCodeSuccessCallback?: (decodedText: string, decodedResult: any) => void;
      qrCodeErrorCallback?: (errorMessage: string, optionalData: any) => void;
    },
    verbose?: boolean
  );
  start(constraints: MediaStreamConstraints): Promise<void>;
  stop(): Promise<void>;
  clear(): void;
}

interface QRScannerProps {
  onScan: (data: string) => void;
  onCancel?: () => void;
  scanningAreaStyle?: React.CSSProperties;
  scanningContainerStyle?: React.CSSProperties;
}

const QRScanner: React.FC<QRScannerProps> = ({ 
  onScan, 
  onCancel,
  scanningAreaStyle,
  scanningContainerStyle
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraAvailable, setIsCameraAvailable] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scanningAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Configuración del scanner
  const qrCodeSuccessCallback = (decodedText: string) => {
    setIsScanning(false);
    onScan(decodedText);
    toast({
      title: "¡Éxito!",
      description: "Código QR escaneado correctamente",
      variant: "default",
    });
  };

  const qrCodeErrorCallback = (err: any) => {
    setError(err.message);
    toast({
      title: "Error",
      description: "Error al escanear el código QR",
      variant: "destructive",
    });
  };

  const startScanner = async () => {
    try {
      if (!containerRef.current || !scanningAreaRef.current) return;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      };

      const scanner = new Html5QrcodeScanner(
        "html5qr-reader",
        config,
        true
      ) as Html5QrcodeScanner;

      await scanner.start({ 
        video: { facingMode: "environment" }
      });
      scannerRef.current = scanner;
      setIsScanning(true);
      setIsCameraAvailable(true);
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error",
        description: "No se pudo iniciar el escáner",
        variant: "destructive",
      });
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        setIsScanning(false);
        scannerRef.current = null;
      });
    }
  };

  useEffect(() => {
    if (!isScanning) {
      stopScanner();
    }
  }, [isScanning]);

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <div 
              ref={containerRef} 
              id="html5qr-reader" 
              style={{ 
                ...scanningContainerStyle,
                width: '100%',
                height: '300px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              <div 
                ref={scanningAreaRef} 
                style={{ 
                  ...scanningAreaStyle,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                {!isCameraAvailable && (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Camera className="w-12 h-12 text-gray-400" />
                    <p className="text-gray-500">Coloca el código QR en el área de escaneo</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={startScanner} 
              disabled={isScanning || isCameraAvailable}
            >
              {isScanning ? 'Scaneando...' : 'Iniciar Escáner'}
            </Button>
            {isScanning && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  stopScanner();
                  onCancel?.();
                }}
              >
                Cancelar
              </Button>
            )}
          </div>

          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QRScanner;