import type { ReactNode } from "react";
import OficialNav from "@/components/OficialNav";
import Toast from "@/components/Toast";

export default function OficialLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <OficialNav />
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
      <Toast />
    </div>
  );
}
