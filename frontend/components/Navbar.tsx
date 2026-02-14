import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full bg-green-600 text-white p-4 flex justify-center gap-6">
      <Link href="/login" className="hover:underline">
        Login
      </Link>
      <Link href="/signup" className="hover:underline">
        Sign Up
      </Link>
    </nav>
  );
}
