export type ToastType = "error" | "success" | "info";

/**
 * Despacha un evento DOM global para mostrar un toast.
 * El componente <Toast /> en el layout escucha este evento.
 */
export function showToast(message: string, type: ToastType = "error") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("app-toast", { detail: { message, type } }),
  );
}
