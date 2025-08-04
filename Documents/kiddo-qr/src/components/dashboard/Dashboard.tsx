
import React, { useState, useEffect } from 'react';
import { Users, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  // States for dashboard data
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState({ present: 0, total: 0 });
  const [weeklyAttendance, setWeeklyAttendance] = useState<{ day: string; present: number; absent: number; }[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<{ name: string; value: number; color: string; }[]>([]);
  
  // Color palette for charts
  const colors = ['#4361EE', '#3A0CA3', '#F72585', '#7209B7', '#4CC9F0'];
  
  // Get current date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Capitalize first letter
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  // Get the start of today and end of today in ISO format
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Function to get the date for days of the week
  const getDayLabel = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toLocaleDateString('es-ES', { weekday: 'short' });
  };

  // Initialize weekly attendance data
  const initWeeklyData = () => {
    return [
      { day: getDayLabel(4), present: 0, absent: 0 },
      { day: getDayLabel(3), present: 0, absent: 0 },
      { day: getDayLabel(2), present: 0, absent: 0 },
      { day: getDayLabel(1), present: 0, absent: 0 },
      { day: getDayLabel(0), present: 0, absent: 0 }
    ];
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch total number of students
        const { count: studentCount, error: countError } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true });
        
        if (countError) throw countError;
        
        setTotalStudents(studentCount || 0);
        
        // 2. Fetch today's attendance
        const startOfToday = todayStart.toISOString();
        const endOfToday = todayEnd.toISOString();
        
        const { data: todayAttendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('student_id')
          .gte('check_in_time', startOfToday)
          .lte('check_in_time', endOfToday);
        
        if (attendanceError) throw attendanceError;
        
        // Get unique student IDs who attended today
        const uniqueStudentsToday = new Set();
        todayAttendanceData?.forEach(record => uniqueStudentsToday.add(record.student_id));
        
        setTodayAttendance({
          present: uniqueStudentsToday.size,
          total: studentCount || 0
        });
        
        // 3. Fetch weekly attendance data
        const weeklyData = initWeeklyData();
        
        // For each of the last 5 days
        for (let i = 0; i < 5; i++) {
          const dayStart = new Date();
          dayStart.setDate(dayStart.getDate() - i);
          dayStart.setHours(0, 0, 0, 0);
          
          const dayEnd = new Date(dayStart);
          dayEnd.setHours(23, 59, 59, 999);
          
          const { data: dayAttendanceData } = await supabase
            .from('attendance')
            .select('student_id')
            .gte('check_in_time', dayStart.toISOString())
            .lte('check_in_time', dayEnd.toISOString());
          
          if (dayAttendanceData) {
            const uniqueStudentsDay = new Set();
            dayAttendanceData.forEach(record => uniqueStudentsDay.add(record.student_id));
            
            // Update the weekly data
            weeklyData[4-i].present = uniqueStudentsDay.size;
            weeklyData[4-i].absent = Math.max(0, (studentCount || 0) - uniqueStudentsDay.size);
          }
        }
        
        setWeeklyAttendance(weeklyData);
        
        // 4. Fetch grade distribution
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('grade');
        
        if (studentsError) throw studentsError;
        
        // Count students by grade
        const gradeCount: Record<string, number> = {};
        
        studentsData?.forEach(student => {
          const grade = student.grade || 'No especificado';
          if (gradeCount[grade]) {
            gradeCount[grade]++;
          } else {
            gradeCount[grade] = 1;
          }
        });
        
        // Convert to array format for PieChart
        const gradeData = Object.keys(gradeCount).map((grade, index) => ({
          name: grade,
          value: gradeCount[grade],
          color: colors[index % colors.length]
        }));
        
        setGradeDistribution(gradeData);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-kiddo-blue" />
      </div>
    );
  }

  // Calculate attendance percentage
  const attendancePercentage = todayAttendance.total > 0 
    ? Math.round((todayAttendance.present / todayAttendance.total) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">{capitalizedDate}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="rounded-full p-3 bg-blue-100">
              <Users className="h-6 w-6 text-kiddo-blue" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Estudiantes</p>
              <h3 className="text-2xl font-bold">{totalStudents}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="rounded-full p-3 bg-purple-100">
              <Calendar className="h-6 w-6 text-kiddo-purple" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Hoy</p>
              <h3 className="text-2xl font-bold">{todayAttendance.present}/{todayAttendance.total}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="rounded-full p-3 bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Asistencia</p>
              <h3 className="text-2xl font-bold">{attendancePercentage}%</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="rounded-full p-3 bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ausencias</p>
              <h3 className="text-2xl font-bold">{todayAttendance.total - todayAttendance.present}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Asistencia Semanal</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyAttendance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="present" name="Presentes" fill="#4361EE" />
                <Bar dataKey="absent" name="Ausentes" fill="#F72585" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estudiantes por Grado</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {gradeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No hay datos disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
