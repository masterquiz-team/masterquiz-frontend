"use client";

import { useRef, type ComponentProps } from "react";
import { useModalDialog, type ModalDialogOptions } from "./useModalDialog";

// The one modal <dialog>: it owns opening, focus, Tab and Escape. Each dialog
// brings its own markup, classes and labels.
export function Modal({
  open,
  busy,
  onClose,
  initialFocus,
  fallbackFocus,
  children,
  ...dialogProps
}: ModalDialogOptions &
  Omit<ComponentProps<"dialog">, "open" | "onClose" | "ref">) {
  const ref = useRef<HTMLDialogElement>(null);
  useModalDialog(ref, { open, busy, onClose, initialFocus, fallbackFocus });
  return (
    <dialog ref={ref} {...dialogProps}>
      {children}
    </dialog>
  );
}
