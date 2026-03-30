'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { API_BASE } from '@/lib/api';
import { validateUsername, validatePassword, validateEmail } from '@/lib/authValidation';

export default function SignUp() {
  const [username, setUsername] = useState(''); // field for usernames
  const [password, setPassword] = useState(''); //pw field
  const [email, setEmail] = useState(''); //email field (notifications)
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }


    try {
      const api = await fetch(`${API_BASE}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password, email: email.trim()}), //added the email to the JSON
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
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
              />
              <TextField
                label="Password"
                placeholder="Enter password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
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