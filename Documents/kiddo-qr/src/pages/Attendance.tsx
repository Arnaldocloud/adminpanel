
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Layout from '@/components/layout/Layout';
import { Calendar as CalendarIcon, UserCheck, UserX, Check, X, Loader2 } from "lucide-react";
import { format, isToday } from "date-fns";
import { supabase } from '@/integrations/supabase/client';

interface Student {
  id: string;
  student_code: string;
  name: string;
  grade?: string | null;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  check_in_time: string;
  student: Student;
}

const Attendance = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (date) {
      fetchAttendanceData(date);
    }
  }, [date]);

  const fetchAttendanceData = async (selectedDate: Date) => {
    try {
      setLoading(true);
      
      // Convertir la fecha seleccionada a ISO string y configurar el rango para ese día
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          student_id,
          check_in_time,
          students (id, student_code, name, grade)
        `)
        .gte('check_in_time', startDate.toISOString())
        .lte('check_in_time', endDate.toISOString())
        .order('check_in_time', { ascending: true });

      if (error) {
        console.error('Error al obtener datos de asistencia:', error);
        setAttendanceData([]);
        return;
      }

      // Transformar los datos para incluir la información del estudiante
      const formattedData = data.map(item => ({
        id: item.id,
        student_id: item.student_id,
        check_in_time: item.check_in_time,
        student: item.students as Student
      }));

      setAttendanceData(formattedData);
    } catch (error) {
      console.error('Error al procesar datos de asistencia:', error);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear la hora
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Calcular totales de asistencia
  const presentStudents = attendanceData.length;
  const totalStudents = attendanceData.length; // En una versión futura, esto debería ser el total de estudiantes, no solo los presentes

  return (
    <Layout>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Registro de Asistencias</h1>
            <p className="text-muted-foreground">
              Visualiza y gestiona la asistencia de los estudiantes.
            </p>
          </div>
          
          <Card className="w-full md:w-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Seleccionar Fecha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 opacity-50" />
                <span className="text-sm font-medium">
                  {date ? format(date, 'PPP') : 'Selecciona una fecha'}
                </span>
              </div>
              <div className="mt-2">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle>Asistencia del día {date ? format(date, 'PP') : ''}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Grado</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No hay registros de asistencia para esta fecha
                        </TableCell>
                      </TableRow>
                    ) : (
                      attendanceData.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.student.student_code}</TableCell>
                          <TableCell>{record.student.name}</TableCell>
                          <TableCell>{record.student.grade}</TableCell>
                          <TableCell>{formatTime(record.check_in_time)}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Check className="mr-1 h-4 w-4 text-green-500" />
                              <span className="text-green-500">Presente</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UserCheck className="h-5 w-5 mr-2 text-green-500" />
                    <span>Presentes</span>
                  </div>
                  <span className="font-bold">{presentStudents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UserX className="h-5 w-5 mr-2 text-red-500" />
                    <span>Ausentes</span>
                  </div>
                  <span className="font-bold">{totalStudents - presentStudents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>Total</div>
                  <span className="font-bold">{totalStudents}</span>
                </div>
                
                {loading && (
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                
                {date && isToday(date) && (
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    <p>Mostrando asistencia de hoy</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Attendance;
