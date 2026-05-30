"use client";

import { useEffect, useState } from "react";
import type { ToastType } from "@/lib/toast";

type ToastItem = { id: number; message: string; type: ToastType };

const TYPE_STYLES: Record<ToastType, string> = {
  error: "bg-red-600 text-white",
  success: "bg-green-600 text-white",
  info: "bg-gray-800 text-white",
};

export default function Toast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    let nextId = 0;

    function handler(e: Event) {
      const { message, type } = (e as CustomEvent<{ message: string; type: ToastType }>)
        .detail;
      const id = ++nextId;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        4000,
      );
    }

    window.addEventListener("app-toast", handler);
    return () => window.removeEventListener("app-toast", handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center w-full max-w-sm px-4 pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`w-full rounded-xl px-4 py-3 text-sm font-medium shadow-lg text-center ${TYPE_STYLES[t.type]}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
