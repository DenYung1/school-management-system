-- NIIT School Management System - Supabase Schema

-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create courses table first (since it's referenced by other tables)
CREATE TABLE public.courses (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  description text,
  duration integer NOT NULL,
  capacity integer NOT NULL,
  faculty text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create students table after courses
CREATE TABLE public.students (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  program text NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  phone text NOT NULL,
  date_of_birth date,
  address text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create enrollments table after both courses and students
CREATE TABLE public.enrollments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(course_id, student_id)
);

-- Create attendance table after both courses and students
CREATE TABLE public.attendance (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  date date NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('Present', 'Absent', 'Late', 'Excused')),
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(date, course_id, student_id)
);

-- Create profiles table (for users)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  avatar_url text,
  role text NOT NULL CHECK (role IN ('admin', 'teacher', 'student')) DEFAULT 'student',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', COALESCE(new.raw_user_meta_data->>'role', 'student'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_timestamp() 
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_students_timestamp
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE PROCEDURE public.update_timestamp();

CREATE TRIGGER update_courses_timestamp
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE PROCEDURE public.update_timestamp();

CREATE TRIGGER update_enrollments_timestamp
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE PROCEDURE public.update_timestamp();

CREATE TRIGGER update_attendance_timestamp
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE PROCEDURE public.update_timestamp();

CREATE TRIGGER update_profiles_timestamp
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_timestamp();

-- Create quizzes table for quiz management feature
CREATE TABLE public.quizzes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  description text,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create quiz_files table for storing uploaded quiz files
CREATE TABLE public.quiz_files (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  uploaded_by uuid REFERENCES auth.users ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create email_notifications table for email notification feature
CREATE TABLE public.email_notifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('attendance', 'quiz', 'system')),
  enabled boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, notification_type)
);

-- Create oauth_providers table for Google login integration
CREATE TABLE public.oauth_providers (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google', 'facebook', 'github')),
  provider_id text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(provider, provider_id)
);

-- Create triggers for new tables
CREATE TRIGGER update_quizzes_timestamp
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE PROCEDURE public.update_timestamp();

CREATE TRIGGER update_quiz_files_timestamp
  BEFORE UPDATE ON public.quiz_files
  FOR EACH ROW EXECUTE PROCEDURE public.update_timestamp();

CREATE TRIGGER update_email_notifications_timestamp
  BEFORE UPDATE ON public.email_notifications
  FOR EACH ROW EXECUTE PROCEDURE public.update_timestamp();

CREATE TRIGGER update_oauth_providers_timestamp
  BEFORE UPDATE ON public.oauth_providers
  FOR EACH ROW EXECUTE PROCEDURE public.update_timestamp();

-- Enable Row Level Security (RLS) after all tables are created
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_providers ENABLE ROW LEVEL SECURITY;

-- Row Level Security (RLS) policies
-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Students policies
CREATE POLICY "Students are viewable by authenticated users." ON public.students
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert students." ON public.students
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND (
    auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'teacher'
  ));

CREATE POLICY "Admins can update students." ON public.students
  FOR UPDATE USING (auth.role() = 'authenticated' AND (
    auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'teacher'
  ));

CREATE POLICY "Admins can delete students." ON public.students
  FOR DELETE USING (auth.role() = 'authenticated' AND (
    auth.jwt() ->> 'role' = 'admin'
  ));

-- Courses policies
CREATE POLICY "Courses are viewable by authenticated users." ON public.courses
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and teachers can insert courses." ON public.courses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'teacher')
  ));

CREATE POLICY "Admins and teachers can update courses." ON public.courses
  FOR UPDATE USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'teacher')
  ));

CREATE POLICY "Admins can delete courses." ON public.courses
  FOR DELETE USING (auth.role() = 'authenticated' AND (
    auth.jwt() ->> 'role' = 'admin'
  ));

-- Quizzes policies
CREATE POLICY "Quizzes are viewable by authenticated users." ON public.quizzes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers and admins can insert quizzes." ON public.quizzes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND (
    auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'teacher'
  ));

CREATE POLICY "Teachers and admins can update quizzes." ON public.quizzes
  FOR UPDATE USING (auth.role() = 'authenticated' AND (
    auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'teacher'
  ));

CREATE POLICY "Teachers and admins can delete quizzes." ON public.quizzes
  FOR DELETE USING (auth.role() = 'authenticated' AND (
    auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'teacher'
  ));

-- Quiz files policies
CREATE POLICY "Quiz files are viewable by authenticated users." ON public.quiz_files
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers and admins can insert quiz files." ON public.quiz_files
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND (
    auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'teacher'
  ));

CREATE POLICY "Teachers and admins can update quiz files." ON public.quiz_files
  FOR UPDATE USING (auth.role() = 'authenticated' AND (
    auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'teacher'
  ));

CREATE POLICY "Teachers and admins can delete quiz files." ON public.quiz_files
  FOR DELETE USING (auth.role() = 'authenticated' AND (
    auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'teacher'
  ));

-- Email notifications policies
CREATE POLICY "Users can view their own email notifications." ON public.email_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email notifications." ON public.email_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email notifications." ON public.email_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email notifications." ON public.email_notifications
  FOR DELETE USING (auth.uid() = user_id);

-- OAuth providers policies
CREATE POLICY "Users can view their own OAuth providers." ON public.oauth_providers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own OAuth providers." ON public.oauth_providers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own OAuth providers." ON public.oauth_providers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own OAuth providers." ON public.oauth_providers
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert courses." ON public.courses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND (
    auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'teacher'
  ));

CREATE POLICY "Admins can update courses." ON public.courses
  FOR UPDATE USING (auth.role() = 'authenticated' AND (
    auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'teacher'
  ));

CREATE POLICY "Admins can delete courses." ON public.courses
  FOR DELETE USING (auth.role() = 'authenticated' AND (
    auth.jwt() ->> 'role' = 'admin'
  ));

-- Enrollments policies
CREATE POLICY "Enrollments are viewable by authenticated users." ON public.enrollments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert enrollments." ON public.enrollments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND (
    auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'teacher'
  ));

CREATE POLICY "Admins can update enrollments." ON public.enrollments
  FOR UPDATE USING (auth.role() = 'authenticated' AND (
    auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'teacher'
  ));

CREATE POLICY "Admins can delete enrollments." ON public.enrollments
  FOR DELETE USING (auth.role() = 'authenticated' AND (
    auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'teacher'
  ));

-- Attendance policies
CREATE POLICY "Attendance records are viewable by authenticated users." ON public.attendance
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert attendance records." ON public.attendance
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND (
    auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'teacher'
  ));

CREATE POLICY "Admins can update attendance records." ON public.attendance
  FOR UPDATE USING (auth.role() = 'authenticated' AND (
    auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'teacher'
  ));

CREATE POLICY "Admins can delete attendance records." ON public.attendance
  FOR DELETE USING (auth.role() = 'authenticated' AND (
    auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'teacher'
  ));
