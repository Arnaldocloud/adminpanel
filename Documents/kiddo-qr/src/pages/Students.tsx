
import React from 'react';
import Layout from '@/components/layout/Layout';
import StudentList from '@/components/students/StudentList';

const Students = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Gestión de Estudiantes</h2>
          <p className="text-muted-foreground">Administra los estudiantes y sus códigos QR</p>
        </div>
        <StudentList />
      </div>
    </Layout>
  );
};

export default Students;
