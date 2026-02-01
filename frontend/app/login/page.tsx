'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const MIN_LENGTH = 3;

export default function Login() {
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
      const api = await fetch('http://localhost:8000/login',{
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (api.ok) {
        router.push('/userhome');
        return;
      }
      setError('Login failed');
    } catch {
      setError('Network error');
    }
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-4 bg-green-50">
      <h1 className="text-4xl font-bold">KeepFresh Login</h1>
      <p className="mt-4">Login Below</p>
      <form onSubmit={handleSubmit} className="min-h-screen p-8 flex flex-col items-center justify-center gap-4">
        {error && <p className="text-red-600 font-medium">{error}</p>}
        <input
          type="text"
          placeholder="Enter Username: "
          value={username}
          onChange={(e) => setUsername(e.target.value)}     
          className="p-4 rounded-lg border border-green-300 gap-4"
        />
        <input
          type="password"
          placeholder="Enter Password: "
          value={password}
          onChange={(e) => setPassword(e.target.value)}    
          className="p-4 rounded-lg border border-green-300 gap-4" 
        />
        <button
          type="submit"
          className="bg-green-600 text-white"
        >
          Log In
        </button>

      </form>
    </div>
  );
}