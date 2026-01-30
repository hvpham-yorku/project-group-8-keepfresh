import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-4">
      <h1 className="text-4xl font-bold">KeepFresh</h1>
      <p className="mt-4">Welcome to KeepFresh!</p>
      <Link href="/login">
        <button className="bg-blue-600 text-white">
         Go to Login
        </button>
      </Link>
      <Link href="/signup">
        <button className="bg-blue-600 text-white">
          Go to Sign Up
        </button>
      </Link>
    </div>
  );
}
