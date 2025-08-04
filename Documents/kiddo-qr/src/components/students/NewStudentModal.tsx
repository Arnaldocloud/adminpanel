import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

const generateStudentCode = () => {
  return `STUDENT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
};

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  grade: z.string().optional(),
  parent: z.string().optional(),
  phone: z.string().optional(),
  photo_url: z.string().optional(),
});

interface NewStudentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStudentAdded: (student: any) => void;
}

const NewStudentModal: React.FC<NewStudentModalProps> = ({ isOpen, onOpenChange, onStudentAdded }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      grade: "",
      parent: "",
      phone: "",
      photo_url: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!user) {
        throw new Error('No estás autenticado');
      }

      const { data, error } = await supabase
        .from('students')
        .insert([{
          name: values.name,
          grade: values.grade,
          parent: values.parent,
          phone: values.phone,
          photo_url: values.photo_url,
          student_code: generateStudentCode(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Éxito",
        description: "Estudiante agregado correctamente",
      });

      onStudentAdded(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Error al agregar estudiante:', error);
      toast({
        title: "Error",
        description: error.message || "Error al agregar el estudiante",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Estudiante</DialogTitle>
          <DialogDescription>
            Llene los campos para agregar un nuevo estudiante al sistema.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nombre del estudiante" />
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
                    <Input {...field} placeholder="Ej: 5to grado" />
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
                  <FormLabel>Padre/Tutor</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nombre del padre o tutor" />
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
                    <Input {...field} placeholder="Número de teléfono" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="photo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de Foto</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="URL de la foto del estudiante" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewStudentModal;
