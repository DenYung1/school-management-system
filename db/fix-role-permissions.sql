-- Run this once in the Supabase SQL Editor for an existing database.

CREATE OR REPLACE FUNCTION public.get_profile_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_profile_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_profile_admin() TO authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_files TO authenticated;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles." ON public.profiles;
CREATE POLICY "Authenticated users can view profiles." ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Students are viewable by authenticated users." ON public.students;
CREATE POLICY "Students are viewable by authenticated users." ON public.students
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Courses are viewable by authenticated users." ON public.courses;
CREATE POLICY "Courses are viewable by authenticated users." ON public.courses
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enrollments are viewable by authenticated users." ON public.enrollments;
CREATE POLICY "Enrollments are viewable by authenticated users." ON public.enrollments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Attendance records are viewable by authenticated users." ON public.attendance;
CREATE POLICY "Attendance records are viewable by authenticated users." ON public.attendance
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Quizzes are viewable by authenticated users." ON public.quizzes;
CREATE POLICY "Quizzes are viewable by authenticated users." ON public.quizzes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Quiz files are viewable by authenticated users." ON public.quiz_files;
CREATE POLICY "Quiz files are viewable by authenticated users." ON public.quiz_files
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id OR public.is_profile_admin())
  WITH CHECK (
    public.is_profile_admin()
    OR (auth.uid() = id AND role = public.get_profile_role(auth.uid()))
  );

DROP POLICY IF EXISTS "Admins can insert students." ON public.students;
DROP POLICY IF EXISTS "Admins can update students." ON public.students;
DROP POLICY IF EXISTS "Admins can delete students." ON public.students;
DROP POLICY IF EXISTS "Admins and teachers can insert courses." ON public.courses;
DROP POLICY IF EXISTS "Admins can insert courses." ON public.courses;
DROP POLICY IF EXISTS "Admins can update courses." ON public.courses;
DROP POLICY IF EXISTS "Admins can delete courses." ON public.courses;
DROP POLICY IF EXISTS "Admins can insert enrollments." ON public.enrollments;
DROP POLICY IF EXISTS "Admins can update enrollments." ON public.enrollments;
DROP POLICY IF EXISTS "Admins can delete enrollments." ON public.enrollments;
DROP POLICY IF EXISTS "Admins can insert attendance records." ON public.attendance;
DROP POLICY IF EXISTS "Admins can update attendance records." ON public.attendance;
DROP POLICY IF EXISTS "Admins can delete attendance records." ON public.attendance;
DROP POLICY IF EXISTS "Teachers and admins can insert quizzes." ON public.quizzes;
DROP POLICY IF EXISTS "Teachers and admins can update quizzes." ON public.quizzes;
DROP POLICY IF EXISTS "Teachers and admins can delete quizzes." ON public.quizzes;
DROP POLICY IF EXISTS "Teachers and admins can insert quiz files." ON public.quiz_files;
DROP POLICY IF EXISTS "Teachers and admins can update quiz files." ON public.quiz_files;
DROP POLICY IF EXISTS "Teachers and admins can delete quiz files." ON public.quiz_files;

CREATE POLICY "Admins can insert students." ON public.students
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  ));

CREATE POLICY "Admins can update students." ON public.students
  FOR UPDATE USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  ));

CREATE POLICY "Admins can delete students." ON public.students
  FOR DELETE USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins and teachers can insert courses." ON public.courses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  ));

CREATE POLICY "Admins can update courses." ON public.courses
  FOR UPDATE USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  ));

CREATE POLICY "Admins can delete courses." ON public.courses
  FOR DELETE USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can insert enrollments." ON public.enrollments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  ));

CREATE POLICY "Admins can update enrollments." ON public.enrollments
  FOR UPDATE USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  ));

CREATE POLICY "Admins can delete enrollments." ON public.enrollments
  FOR DELETE USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  ));

CREATE POLICY "Admins can insert attendance records." ON public.attendance
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  ));

CREATE POLICY "Admins can update attendance records." ON public.attendance
  FOR UPDATE USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  ));

CREATE POLICY "Admins can delete attendance records." ON public.attendance
  FOR DELETE USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  ));

CREATE POLICY "Teachers and admins can insert quizzes." ON public.quizzes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  ));

CREATE POLICY "Teachers and admins can update quizzes." ON public.quizzes
  FOR UPDATE USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  ));

CREATE POLICY "Teachers and admins can delete quizzes." ON public.quizzes
  FOR DELETE USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  ));

CREATE POLICY "Teachers and admins can insert quiz files." ON public.quiz_files
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  ));

CREATE POLICY "Teachers and admins can update quiz files." ON public.quiz_files
  FOR UPDATE USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  ));

CREATE POLICY "Teachers and admins can delete quiz files." ON public.quiz_files
  FOR DELETE USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  ));

-- Provision the private quiz-files bucket and restrict access to authenticated users.
INSERT INTO storage.buckets (id, name, public)
VALUES ('quiz_files', 'quiz_files', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Authenticated users can view quiz files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers and admins can upload quiz files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers and admins can update quiz files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers and admins can delete quiz files" ON storage.objects;

CREATE POLICY "Authenticated users can view quiz files" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'quiz_files');

CREATE POLICY "Teachers and admins can upload quiz files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'quiz_files' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Teachers and admins can update quiz files" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'quiz_files' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Teachers and admins can delete quiz files" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'quiz_files' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );