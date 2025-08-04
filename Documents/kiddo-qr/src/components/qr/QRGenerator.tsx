
import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Clipboard, Download, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface QRGeneratorProps {
  studentId: string;
  studentName: string;
  photoUrl?: string | null;
}

const QRGenerator = ({ studentId, studentName, photoUrl }: QRGeneratorProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  // Function to generate avatar initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const downloadQRCode = () => {
    const qrCodeElement = document.getElementById('qr-' + studentId);
    if (!qrCodeElement) return;
    
    const svgData = new XMLSerializer().serializeToString(qrCodeElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `qr-${studentName.replace(/\s+/g, '-').toLowerCase()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      
      toast({
        title: "QR descargado",
        description: `El código QR de ${studentName} ha sido descargado`,
      });
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const copyQRCode = async () => {
    try {
      const qrCodeElement = document.getElementById('qr-' + studentId);
      if (!qrCodeElement) return;
      
      const svgData = new XMLSerializer().serializeToString(qrCodeElement);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      
      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              // Usar la API moderna de portapapeles
              const data = [new ClipboardItem({ [blob.type]: blob })];
              await navigator.clipboard.write(data);
              
              setCopied(true);
              toast({
                title: "QR copiado",
                description: `El código QR de ${studentName} ha sido copiado al portapapeles`
              });
              setTimeout(() => setCopied(false), 2000);
            } catch (err) {
              console.error('Error al copiar: ', err);
              toast({
                title: "Error",
                description: "No se pudo copiar el código QR",
                variant: "destructive"
              });
            }
          }
        });
      };
      
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    } catch (error) {
      console.error('Error al copiar QR:', error);
      toast({
        title: "Error",
        description: "No se pudo copiar el código QR",
        variant: "destructive"
      });
    }
  };

  // New function to print the student ID card
  const printStudentIDCard = () => {
    if (!cardRef.current) return;
    
    const printContent = document.createElement('div');
    printContent.className = 'student-id-card';
    
    // Create the student ID card layout
    printContent.innerHTML = `
      <style>
        @media print {
          body { margin: 0; padding: 0; }
          .student-id-card {
            width: 3.375in;
            height: 2.125in;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: none;
            page-break-inside: avoid;
            background-color: white;
            display: flex;
            flex-direction: column;
          }
          .header {
            background-color: #4361EE;
            color: white;
            padding: 10px;
            text-align: center;
            font-weight: bold;
            font-size: 14px;
          }
          .content {
            display: flex;
            padding: 15px;
          }
          .photo {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            border: 2px solid #ddd;
            overflow: hidden;
            background-color: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .photo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .photo-fallback {
            font-size: 24px;
            font-weight: bold;
            color: #555;
          }
          .info {
            flex: 1;
            padding-left: 15px;
          }
          .name {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 5px;
          }
          .id-number, .grade {
            font-size: 12px;
            margin-bottom: 3px;
            color: #555;
          }
          .qr-code {
            display: flex;
            justify-content: center;
            padding-bottom: 10px;
          }
        }
      </style>
      <div class="student-id-card">
        <div class="header">CARNET ESTUDIANTIL</div>
        <div class="content">
          <div class="photo">
            ${photoUrl 
              ? `<img src="${photoUrl}" alt="${studentName}" />` 
              : `<div class="photo-fallback">${getInitials(studentName)}</div>`
            }
          </div>
          <div class="info">
            <div class="name">${studentName}</div>
            <div class="id-number">ID: ${studentId}</div>
          </div>
        </div>
        <div class="qr-code">
          <svg width="100" height="100">${document.getElementById('qr-' + studentId)?.innerHTML || ''}</svg>
        </div>
      </div>
    `;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "No se pudo abrir la ventana de impresión. Verifica que los popups estén habilitados.",
        variant: "destructive"
      });
      return;
    }
    
    printWindow.document.open();
    printWindow.document.write(printContent.outerHTML);
    printWindow.document.close();
    
    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      
      // Close the print window after printing (or after a delay if print was canceled)
      setTimeout(() => {
        try {
          printWindow.close();
        } catch (e) {
          console.error('Error closing print window:', e);
        }
      }, 1000);
    };
    
    toast({
      title: "Imprimiendo carnet",
      description: `El carnet de ${studentName} se está imprimiendo`
    });
  };

  return (
    <Card className="w-full" ref={cardRef}>
      <CardHeader>
        <CardTitle className="text-center">Código QR para {studentName}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        <div className="mb-4">
          <Avatar className="h-24 w-24 mx-auto border-2 border-gray-200">
            <AvatarImage src={photoUrl || undefined} alt={studentName} />
            <AvatarFallback>{getInitials(studentName)}</AvatarFallback>
          </Avatar>
        </div>
        <div className="border-4 border-dashed border-gray-200 p-4 rounded-lg bg-white">
          <QRCodeSVG
            id={`qr-${studentId}`}
            value={studentId}
            size={200}
            bgColor={"#ffffff"}
            fgColor={"#000000"}
            level={"H"}
            includeMargin={true}
          />
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex items-center gap-1" onClick={copyQRCode}>
            {copied ? <Check size={16} /> : <Clipboard size={16} />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
          <Button variant="outline" className="flex items-center gap-1" onClick={printStudentIDCard}>
            <Printer size={16} />
            Imprimir Carnet
          </Button>
          <Button className="flex items-center gap-1 bg-kiddo-blue hover:bg-blue-700" onClick={downloadQRCode}>
            <Download size={16} />
            Descargar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRGenerator;
