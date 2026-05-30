"use client";

import { signOut } from "next-auth/react";

export default function OficialNav() {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <span className="font-bold text-gray-800">Roll Manager</span>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="text-sm text-red-600 hover:underline"
      >
        Cerrar sesión
      </button>
    </header>
  );
}
