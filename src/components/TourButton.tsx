"use client";

import { useCallback } from "react";
import { driver } from "driver.js";
import type { DriveStep } from "driver.js";

type Props = {
  steps: DriveStep[];
  /** Etiqueta accesible del botón, por defecto "Iniciar tour" */
  label?: string;
};

export default function TourButton({ steps, label = "Iniciar tour" }: Props) {
  const startTour = useCallback(() => {
    const d = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      nextBtnText: "Siguiente →",
      prevBtnText: "← Anterior",
      doneBtnText: "¡Listo!",
      progressText: "{{current}} de {{total}}",
      popoverClass: "rm-tour-popover",
      steps,
    });
    d.drive();
  }, [steps]);

  return (
    <button
      onClick={startTour}
      aria-label={label}
      title={label}
      className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors text-sm font-bold shrink-0"
    >
      ?
    </button>
  );
}
