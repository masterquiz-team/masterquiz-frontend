import { useEffect, useEffectEvent, type RefObject } from "react";

const CONTROLS =
  'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]';

type Radio = { name: string; checked: boolean };

// A named radio group is one Tab stop, as in the browser: its checked option,
// or its first option while none is checked. Arrow keys move inside it.
export function tabStops<T>(
  controls: readonly T[],
  radioOf: (control: T) => Radio | null,
): T[] {
  const stops = new Map<string, T>();
  for (const control of controls) {
    const radio = radioOf(control);
    if (!radio) continue;
    const stop = stops.get(radio.name);
    if (stop === undefined || (radio.checked && !radioOf(stop)?.checked))
      stops.set(radio.name, control);
  }
  return controls.filter((control) => {
    const radio = radioOf(control);
    return !radio || stops.get(radio.name) === control;
  });
}

const radioOf = (element: HTMLElement): Radio | null =>
  element instanceof HTMLInputElement &&
  element.type === "radio" &&
  element.name
    ? element
    : null;

export type ModalDialogOptions = {
  open?: boolean;
  // A busy dialog cannot be closed.
  busy?: boolean;
  onClose: () => void;
  initialFocus?: (dialog: HTMLDialogElement) => HTMLElement | null;
  // Gets focus on close when the element focused before opening is gone.
  fallbackFocus?: () => HTMLElement | null;
};

// Opens a <dialog> as a modal while `open` is true. It focuses the initial
// control, keeps Tab inside, and restores focus when it closes. Escape and a
// native close call onClose unless the dialog is busy.
export function useModalDialog(
  ref: RefObject<HTMLDialogElement | null>,
  {
    open = true,
    busy = false,
    onClose,
    initialFocus,
    fallbackFocus,
  }: ModalDialogOptions,
) {
  const isBusy = useEffectEvent(() => busy);
  const requestClose = useEffectEvent(() => onClose());
  const focusInitial = useEffectEvent((dialog: HTMLDialogElement) =>
    initialFocus?.(dialog)?.focus(),
  );
  const focusFallback = useEffectEvent(() => fallbackFocus?.()?.focus());

  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (!dialog.open) dialog.showModal();
    focusInitial(dialog);

    const handleCancel = (event: Event) => {
      if (event.target !== dialog) return;
      event.preventDefault();
      if (!isBusy()) requestClose();
    };
    // Chrome can close a modal without a cancel event after repeated Escape
    // presses. A close queued by an earlier cleanup (Strict Mode) finds the
    // dialog open again. A busy dialog reopens so its result is not lost.
    const handleClose = (event: Event) => {
      if (event.target !== dialog || dialog.open) return;
      if (isBusy()) dialog.showModal();
      else requestClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      // A nested dialog keeps Tab inside itself.
      if (
        event.key !== "Tab" ||
        !(event.target instanceof Element) ||
        event.target.closest("dialog") !== dialog
      )
        return;
      const controls = tabStops(
        Array.from(dialog.querySelectorAll<HTMLElement>(CONTROLS)).filter(
          (element) => element.getClientRects().length > 0,
        ),
        radioOf,
      );
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("keydown", handleKeyDown);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("keydown", handleKeyDown);
      dialog.close();
      if (previous?.isConnected) previous.focus();
      else focusFallback();
    };
  }, [open, ref]);
}
