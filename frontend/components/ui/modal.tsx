"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "./button";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
};

export function Modal({ open, title, description, children, onClose, footer }: ModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-night/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className={cn("w-full max-w-lg animate-fade-up rounded-2xl border border-white/50 bg-white shadow-soft")}>
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 p-5">
          <div>
            <h2 className="text-xl font-black text-night">{title}</h2>
            {description ? <p className="mt-1 text-sm leading-6 text-stone-600">{description}</p> : null}
          </div>
          <Button aria-label="Fermer" size="icon" variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
        <div className="p-5">{children}</div>
        {footer ? <div className="flex justify-end gap-3 border-t border-stone-100 p-5">{footer}</div> : null}
      </div>
    </div>
  );
}
