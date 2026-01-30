'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';


export default function Login() {
  const [username, setUsername ] = useState('');
  const [password, setPassword ] = useState('');
  const router = useRouter();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/userhome');
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-4">
      <h1 className="text-4xl font-bold">KeepFresh Login</h1>
      <p className="mt-4">Login Below</p>
      <form onSubmit={handleSubmit} className="min-h-screen p-8 flex flex-col items-center justify-center gap-4">
        <input
          type="text"
          placeholder="Enter Username: "
          value={username}
          onChange={(e) => setUsername(e.target.value)}     
          className="p-8"
        />
        <input
          type="password"
          placeholder="Enter Password: "
          value={password}
          onChange={(e) => setPassword(e.target.value)}    
          className="p-8" 
        />
        <button
          type="submit"
          className="bg-blue-600 text-white"
        >
          Log In
        </button>

      </form>
    </div>
  );
}