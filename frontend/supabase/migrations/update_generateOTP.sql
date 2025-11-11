-- Fix security warning: Update generate_otp function with search_path
CREATE OR REPLACE FUNCTION public.generate_otp()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  otp TEXT;
BEGIN
  otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  RETURN otp;
END;
$$;