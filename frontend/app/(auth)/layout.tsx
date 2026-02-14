import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
