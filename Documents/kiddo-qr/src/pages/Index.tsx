import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QrCode, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import QRScanner from '@/components/qr/QRScanner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Define a clear interface for the Student type
interface Student {
  id: string;
  student_code: string;
  name: string;
  grade?: string;
  parent?: string;
  phone?: string;
  photo_url?: string | null;
}

interface AttendanceRecord {
  id: string;
  check_in_time: string;
  student_id: string;
  students: Student;
}

const Index = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedStudentId, setScannedStudentId] = useState<string | null>(null);
  const [scannedStudent, setScannedStudent] = useState<Student | null>(null);
  const [recentScans, setRecentScans] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingScans, setFetchingScans] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch recent attendance scans
  useEffect(() => {
    const fetchRecentScans = async () => {
      try {
        setFetchingScans(true);
        const { data, error } = await supabase
          .from('attendance')
          .select('id, check_in_time, student_id, students(*)')
          .order('check_in_time', { ascending: false })
          .limit(5);

        if (error) throw error;
        
        // Type assertion to help TypeScript understand the structure
        setRecentScans(data as AttendanceRecord[]);
      } catch (error) {
        console.error('Error fetching recent scans:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los registros recientes",
          variant: "destructive",
        });
      } finally {
        setFetchingScans(false);
      }
    };

    fetchRecentScans();
  }, [toast, scannedStudentId]);

  const handleScan = async (data: string | null) => {
    if (data) {
      try {
        setLoading(true);
        setScannedStudentId(data);
        
        // Fetch student data
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', data)
          .single();
        
        if (studentError) {
          throw new Error('Estudiante no encontrado');
        }
        
        setScannedStudent(studentData as Student);
        
        // Register attendance
        const { error: attendanceError } = await supabase
          .from('attendance')
          .insert([{ student_id: data }]);
        
        if (attendanceError) {
          throw new Error('Error al registrar asistencia');
        }
        
        toast({
          title: "Asistencia registrada",
          description: `${studentData.name} ha sido registrado exitosamente`,
        });
        
      } catch (error) {
        console.error('Error en el escaneo:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Error al procesar el código QR",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setShowScanner(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Registro de Asistencia</h2>
          <p className="text-muted-foreground">
            Escanea el código QR del estudiante para registrar su asistencia
          </p>
        </div>

        {showScanner ? (
          <Card>
            <CardContent className="p-6">
              <QRScanner 
                onScan={handleScan} 
                onCancel={() => setShowScanner(false)}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            <Card className="overflow-hidden">
              <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
                <QrCode className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Escanear Código QR</h3>
                <p className="text-center text-muted-foreground mb-6">
                  Escanea el código QR del estudiante para registrar su entrada o salida
                </p>
                <Button 
                  size="lg" 
                  className="bg-kiddo-blue hover:bg-blue-700"
                  onClick={() => setShowScanner(true)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Escanear Código QR'
                  )}
                </Button>
              </CardContent>
            </Card>

            <div>
              <h3 className="text-lg font-semibold mb-4">Escaneos Recientes</h3>
              {fetchingScans ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : recentScans.length > 0 ? (
                <div className="space-y-3">
                  {recentScans.map((scan) => (
                    <div 
                      key={scan.id} 
                      className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                          {scan.students?.photo_url ? (
                            <img 
                              src={scan.students.photo_url} 
                              alt={scan.students.name}
                              className="h-full w-full object-cover" 
                            />
                          ) : (
                            <span className="text-xs font-medium text-gray-500">
                              {scan.students?.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{scan.students?.name}</p>
                          <p className="text-sm text-muted-foreground">{scan.students?.grade}</p>
                        </div>
                      </div>
                      <div className="text-sm text-right">
                        <p className="text-muted-foreground">Entrada</p>
                        <p className="font-medium">{formatDate(scan.check_in_time)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay registros recientes
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Index;
