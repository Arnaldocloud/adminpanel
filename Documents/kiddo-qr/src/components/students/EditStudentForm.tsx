
import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Student {
  id: string;
  student_code: string;
  name: string;
  grade?: string;
  parent?: string;
  phone?: string;
  photo_url?: string;
}

interface EditStudentFormProps {
  student: Student;
  onSubmit: (updatedStudent: Student) => void;
  onCancel: () => void;
}

const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  grade: z.string().optional(),
  parent: z.string().optional(),
  phone: z.string().optional(),
  photo_url: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const EditStudentForm = ({ student, onSubmit, onCancel }: EditStudentFormProps) => {
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: student.name,
      grade: student.grade || '',
      parent: student.parent || '',
      phone: student.phone || '',
      photo_url: student.photo_url || '',
    },
  });

  // Function to generate avatar initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSubmit = (data: FormValues) => {
    const updatedStudent = {
      ...student,
      ...data,
    };
    
    onSubmit(updatedStudent);
    
    toast({
      title: "Perfil actualizado",
      description: "La información del estudiante ha sido actualizada",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="flex justify-center mb-4">
          <Avatar className="h-24 w-24 border-2 border-gray-200">
            <AvatarImage src={form.watch('photo_url')} alt={form.watch('name')} />
            <AvatarFallback>{getInitials(form.watch('name'))}</AvatarFallback>
          </Avatar>
        </div>
        
        <FormField
          control={form.control}
          name="photo_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de la Foto</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input placeholder="Nombre del estudiante" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="grade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grado</FormLabel>
              <FormControl>
                <Input placeholder="Ej: 8vo B" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="parent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Representante</FormLabel>
              <FormControl>
                <Input placeholder="Nombre del representante" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input placeholder="+58414..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-kiddo-blue hover:bg-blue-700">
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EditStudentForm;
