-- Create OTP codes table
CREATE TABLE public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('registration', 'login', 'deposit', 'withdraw', 'password_reset')),
  verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on otp_codes
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX idx_otp_codes_email ON public.otp_codes(email);
CREATE INDEX idx_otp_codes_user_id ON public.otp_codes(user_id);
CREATE INDEX idx_otp_codes_expires_at ON public.otp_codes(expires_at);

-- RLS Policies for otp_codes
CREATE POLICY "Users can view their own OTP codes"
  ON public.otp_codes FOR SELECT
  USING (
    auth.uid() = user_id OR 
    (auth.uid() IS NULL AND email IS NOT NULL)
  );

CREATE POLICY "Anyone can insert OTP codes"
  ON public.otp_codes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own OTP codes"
  ON public.otp_codes FOR UPDATE
  USING (auth.uid() = user_id OR (auth.uid() IS NULL AND email IS NOT NULL));

-- Function to clean up expired OTP codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.otp_codes
  WHERE expires_at < NOW();
END;
$$;

-- Function to generate random 6-digit OTP
CREATE OR REPLACE FUNCTION public.generate_otp()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  otp TEXT;
BEGIN
  otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  RETURN otp;
END;
$$;