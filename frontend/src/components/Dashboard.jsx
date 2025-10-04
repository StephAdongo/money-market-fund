import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Button, 
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { userService, transactionService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TransactionForm from './TransactionForm';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionType, setTransactionType] = useState('');
  const { logout } = useAuth();

  useEffect(() => {
    fetchUserData();
    fetchTransactions();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await userService.getProfile();
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await transactionService.getTransactions();
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const handleTransactionComplete = () => {
    setShowTransactionForm(false);
    fetchUserData();
    fetchTransactions();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Dashboard</Typography>
        <Button variant="outlined" color="error" onClick={logout}>
          Logout
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Account Balance
            </Typography>
            <Typography variant="h4" color="primary">
              ${user?.balance?.toFixed(2) || '0.00'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Daily Interest Rate: {(user?.daily_interest_rate * 100).toFixed(3)}%
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  setTransactionType('deposit');
                  setShowTransactionForm(true);
                }}
              >
                Deposit
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  setTransactionType('withdrawal');
                  setShowTransactionForm(true);
                }}
              >
                Withdraw
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Transactions
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </TableCell>
                      <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                      <TableCell>{transaction.status}</TableCell>
                      <TableCell>
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {showTransactionForm && (
        <TransactionForm
          type={transactionType}
          onClose={() => setShowTransactionForm(false)}
          onComplete={handleTransactionComplete}
        />
      )}
    </Container>
  );
};

export default Dashboard;