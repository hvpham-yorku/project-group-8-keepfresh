'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UserHome() {
  const router = useRouter();
  useEffect(() => {
    const user_token = localStorage.getItem("user_token");
    if(!user_token){
      router.push("/login")
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-4 bg-green-50">
      <h1 className="text-4xl font-bold">Welcome to Your Home Page</h1>
      <p className="mt-4">Get Started Below</p>
    </div>
  );
}