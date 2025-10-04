import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Container, Box, Alert } from '@mui/material';
import { authService } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(600);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const email = location.state?.email || '';

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.verifyOTP(email, otp);
      login(response.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authService.resendOTP(email);
      setCountdown(600);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  if (!email) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Invalid request
          </Typography>
          <Button onClick={() => navigate('/register')} sx={{ mt: 2 }}>
            Go to Register
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Verify Your Email
        </Typography>
        <Typography sx={{ mt: 2, textAlign: 'center' }}>
          We've sent a 6-digit code to {email}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleVerify} sx={{ mt: 3, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Verification Code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            inputProps={{ maxLength: 6 }}
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Expires in: {formatTime(countdown)}
          </Typography>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading || otp.length !== 6}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
        </Box>

        <Button
          onClick={handleResend}
          disabled={countdown > 0}
          sx={{ mt: 2 }}
        >
          {countdown > 0 ? `Resend in ${formatTime(countdown)}` : 'Resend Code'}
        </Button>
      </Box>
    </Container>
  );
};

export default VerifyOTP;