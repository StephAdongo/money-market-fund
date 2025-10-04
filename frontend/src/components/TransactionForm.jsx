import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  Button,
  Typography,
  Alert
} from '@mui/material';
import { transactionService } from '../services/api';

const TransactionForm = ({ type, onClose, onComplete }) => {
  const [amount, setAmount] = useState('');
  const [otp, setOtp] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const handleSubmitAmount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await transactionService.initiateTransaction(type, parseFloat(amount));
      setTransactionId(response.data.transactionId);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await transactionService.verifyTransaction(transactionId, otp);
      onComplete();
    } catch (err) {
      setError(err.response?.data?.message || 'Transaction verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {type === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {step === 1 && (
          <Box component="form" onSubmit={handleSubmitAmount}>
            <TextField
              autoFocus
              margin="dense"
              label="Amount ($)"
              type="number"
              fullWidth
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputProps={{ min: 0.01, step: 0.01 }}
            />
          </Box>
        )}

        {step === 2 && (
          <Box component="form" onSubmit={handleSubmitOTP}>
            <Typography sx={{ mb: 2 }}>
              Please check your email for the verification code and enter it below.
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              label="Verification Code"
              fullWidth
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              inputProps={{ maxLength: 6 }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {step === 1 && (
          <Button 
            onClick={handleSubmitAmount} 
            disabled={!amount || loading}
          >
            {loading ? 'Processing...' : 'Continue'}
          </Button>
        )}
        {step === 2 && (
          <Button 
            onClick={handleSubmitOTP} 
            disabled={!otp || otp.length !== 6 || loading}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TransactionForm;