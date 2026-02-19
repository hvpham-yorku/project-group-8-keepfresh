'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

const MIN_LENGTH = 3;

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (username.trim().length < MIN_LENGTH) {
      setError(`Username must be at least ${MIN_LENGTH} characters`);
      return;
    }
    if (password.length < MIN_LENGTH) {
      setError(`Password must be at least ${MIN_LENGTH} characters`);
      return;
    }
    try {
      const api = await fetch('http://localhost:8000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await api.json().catch(() => ({}));
      if (api.ok) {
        router.push('/login');
        return;
      }
      const detail = (data as { detail?: unknown }).detail as
        | { msg?: string }[]
        | string
        | undefined;
      const msg =
        Array.isArray(detail)
          ? detail
              .map((d) => d?.msg)
              .filter(Boolean)
              .join(', ') || 'Validation failed'
          : detail || (api.status === 409 ? 'Username already taken' : 'Sign up failed');
      setError(msg);
    } catch {
      setError('Network error');
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
        <Stack spacing={3}>
          <Box textAlign="center">
            <Typography variant="h4" component="h1" fontWeight={700}>
              KeepFresh Sign Up
            </Typography>
            <Typography color="text.secondary">Create an account to track your fridge</Typography>
          </Box>

          {error && (
            <Alert severity="error" variant="outlined">
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                fullWidth
              />
              <TextField
                label="Password"
                placeholder="Enter password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
              />
              <Button type="submit" variant="contained" color="primary" size="large" fullWidth>
                Sign Up
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}