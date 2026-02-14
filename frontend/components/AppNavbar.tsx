import Link from "next/link";

export default function AppNavbar() {
  return (
    <nav className="w-full bg-blue-600 text-white p-4 flex justify-center gap-6">
      <Link href="/userhome">Fridge</Link>
      <Link href="/profile">Profile</Link>
      <Link href="/login">Logout</Link>
    </nav>
  );
}
