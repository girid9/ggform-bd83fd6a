CREATE POLICY "Anyone can delete quiz attempts"
ON public.quiz_attempts
FOR DELETE
USING (true);