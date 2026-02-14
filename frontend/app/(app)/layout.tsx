import type { ReactNode } from "react";
import AppNavbar from "@/components/AppNavbar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppNavbar />
      {children}
    </>
  );
}
