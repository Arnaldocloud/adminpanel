import React, { useState, useEffect } from 'react';
import { Search, Plus, FileDown, QrCode, UserPlus, Filter, User, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';
import QRModal from './QRModal';
import NewStudentModal from './NewStudentModal';
import StudentProfileModal from './StudentProfileModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Definición del tipo para estudiantes
interface Student {
  id: string;
  name: string;
  student_code: string;
  grade?: string;
  parent?: string;
  phone?: string;
  photo_url?: string;
}

const StudentList = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Cargar estudiantes desde Supabase
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('name');

        if (error) throw error;

        setStudents(data || []);
      } catch (error) {
        console.error('Error al cargar los estudiantes:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los estudiantes",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [toast]);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.grade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.parent?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleShowQR = (student: Student) => {
    setSelectedStudent(student);
    setIsQRModalOpen(true);
  };

  const handleShowProfile = (student: Student) => {
    setSelectedStudent(student);
    setIsProfileModalOpen(true);
  };

  const handleAddStudent = async (newStudent: Omit<Student, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([newStudent])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setStudents((prevStudents) => [...prevStudents, data[0]]);

        toast({
          title: "Estudiante agregado",
          description: `${newStudent.name} ha sido agregado exitosamente.`,
        });
      }
    } catch (error) {
      console.error('Error al agregar estudiante:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el estudiante",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({
          name: updatedStudent.name,
          grade: updatedStudent.grade,
          parent: updatedStudent.parent,
          phone: updatedStudent.phone,
          photo_url: updatedStudent.photo_url
        })
        .eq('id', updatedStudent.id);

      if (error) throw error;

      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.id === updatedStudent.id ? updatedStudent : student
        )
      );
      setSelectedStudent(updatedStudent);

      toast({
        title: "Estudiante actualizado",
        description: `La información de ${updatedStudent.name} ha sido actualizada`,
      });
    } catch (error) {
      console.error('Error al actualizar el estudiante:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estudiante",
        variant: "destructive",
      });
    }
  };

  const generateAllQRs = () => {
    toast({
      title: "Generando QRs",
      description: "Se están generando los QRs para todos los estudiantes",
    });
    // En una aplicación real, esto generaría todos los QRs y los empaquetaría para descargar
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4">
          <CardTitle>Lista de Estudiantes</CardTitle>
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
            <Button size="sm" variant="outline">
              <FileDown className="h-4 w-4 mr-1" />
              Exportar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={generateAllQRs}
            >
              <QrCode className="h-4 w-4 mr-1" />
              Generar QRs
            </Button>
            <Button
              size="sm"
              variant="default"
              className="bg-kiddo-blue hover:bg-blue-700"
              onClick={() => setIsNewStudentModalOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Nuevo Estudiante
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar estudiantes..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="flex-shrink-0">
              <Filter className="h-4 w-4 mr-1" />
              Filtrar
            </Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Código</TableHead>
                  <TableHead className="w-[150px]">Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Grado</TableHead>
                  <TableHead className="hidden md:table-cell">Padre/Tutor</TableHead>
                  <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Cargando estudiantes...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron estudiantes
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student, index) => (
                    <TableRow key={index}>
                      <TableCell>{student.student_code}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{student.grade}</TableCell>
                      <TableCell className="hidden md:table-cell">{student.parent}</TableCell>
                      <TableCell className="hidden md:table-cell">{student.phone}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowQR(student)}
                          >
                            <QrCode className="h-4 w-4 mr-1" />
                            QR
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowProfile(student)}
                          >
                            <User className="h-4 w-4 mr-1" />
                            Perfil
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <NewStudentModal
        isOpen={isNewStudentModalOpen}
        onOpenChange={setIsNewStudentModalOpen}
        onStudentAdded={(student) => {
          setStudents((prev) => [...prev, student]);
          toast({
            title: "Éxito",
            description: "Estudiante agregado exitosamente",
          });
        }}
      />

      <QRModal
        isOpen={isQRModalOpen}
        onOpenChange={setIsQRModalOpen}
        student={selectedStudent}
      />

      <StudentProfileModal
        isOpen={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
        student={selectedStudent}
        onShowQR={(student) => setIsQRModalOpen(true)}
      />
    </>
  );
};

export default StudentList;
