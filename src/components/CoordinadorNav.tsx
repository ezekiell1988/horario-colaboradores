"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/coordinador/hoy", label: "Hoy" },
  { href: "/coordinador/asistencia", label: "Asistencia" },
];

export default function CoordinadorNav() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-gray-800 text-base">Roll Manager</span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          Salir
        </button>
      </div>
      <nav
        className="flex overflow-x-auto scrollbar-none border-t border-gray-100"
        aria-label="Navegación coordinador"
      >
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                active
                  ? "border-teal-600 text-teal-700 bg-teal-50/50"
                  : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
