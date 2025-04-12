
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import QRGenerator from '@/components/qr/QRGenerator';

interface Student {
  id: string;
  student_code: string;
  name: string;
  grade?: string;
  parent?: string;
  phone?: string;
  photo_url?: string;
}

interface QRModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
}

const QRModal = ({ isOpen, onOpenChange, student }: QRModalProps) => {
  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Código QR del Estudiante</DialogTitle>
          <DialogDescription>
            Este código QR puede ser utilizado para registrar la asistencia del estudiante.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <QRGenerator 
            studentId={student.student_code} 
            studentName={student.name}
            photoUrl={student.photo_url}
          />
        </div>
        <DialogFooter className="sm:justify-center">
          <DialogClose asChild>
            <Button variant="outline">Cerrar</Button>
          </DialogClose>
          <Button type="button" className="bg-kiddo-blue hover:bg-blue-700">
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QRModal;
