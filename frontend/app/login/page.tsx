'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';


export default function Login() {
  const [username, setUsername ] = useState('');
  const [password, setPassword ] = useState('');
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const api = await fetch("http://localhost:8000/login",{
        method: "POST",
        headers: {
         "Content-Type": "application/json",
        },
        body: JSON.stringify({username, password}),
      });
      if(api.ok){
        router.push('/userhome');
      }
      else{
        alert("Login Failed");
      }
    }
    catch(err){
      alert("Network Error");
    }
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-4 bg-green-50">
      <h1 className="text-4xl font-bold">KeepFresh Login</h1>
      <p className="mt-4">Login Below</p>
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
          Log In
        </button>

      </form>
    </div>
  );
}