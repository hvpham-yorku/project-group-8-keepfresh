'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUp() {
  const [username, setUsername ] = useState('');
  const [password, setPassword ] = useState('');
  const router = useRouter();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/login');
  }


  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-4 bg-green-50">
      <h1 className="text-4xl font-bold">KeepFresh Sign Up</h1>
      <p className="mt-4">Sign Up Below!</p>
      <form onSubmit={handleSubmit} className="min-h-screen p-8 flex flex-col items-center justify-center gap-4">
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
          Sign Up
        </button>

      </form>
    </div>
  );
}