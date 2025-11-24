-- Add RLS policy for admins to view all OTP codes for monitoring
CREATE POLICY "Admins can view all OTP codes"
ON public.otp_codes
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));