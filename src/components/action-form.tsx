"use client";
import { useActionState, useEffect, useRef, startTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionState } from "@/lib/types";
import { PendingContext } from "@/components/ui/submit-button";

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Form wrapper around a server action.
 * - Does NOT auto-reset on error (unlike a bare React 19 <form action>), so users keep their input.
 * - Shows a toast for success/error unless `toasts={false}`.
 * - `resetOnSuccess` clears the form after a successful submit (for "add" forms).
 */
export function ActionForm({
  action, children, className, resetOnSuccess, toasts = true, confirm, onSuccess, onError, id,
}: {
  action: Action;
  children: React.ReactNode | ((state: ActionState) => React.ReactNode);
  className?: string;
  resetOnSuccess?: boolean;
  toasts?: boolean;
  confirm?: string;
  onSuccess?: (state: ActionState) => void;
  onError?: (state: ActionState) => void;
  id?: string;
}) {
  const [state, dispatch, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!state) return;
    if (state.error) {
      if (toasts) toast.error(state.error);
      onError?.(state);
    } else if (state.ok) {
      if (toasts && state.message) toast.success(state.message);
      if (resetOnSuccess) ref.current?.reset();
      onSuccess?.(state);
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <PendingContext.Provider value={pending}>
      <form
        id={id}
        ref={ref}
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          if (confirm && !window.confirm(confirm)) return;
          const fd = new FormData(e.currentTarget);
          const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
          if (submitter?.name) fd.set(submitter.name, submitter.value);
          startTransition(() => dispatch(fd));
        }}
      >
        {typeof children === "function" ? children(state) : children}
      </form>
    </PendingContext.Provider>
  );
}
