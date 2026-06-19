import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { cn } from '../../lib/utils';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  // Support both naming conventions used throughout the codebase
  isOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCancel?: () => void;
  title: string;
  description?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  isDestructive?: boolean;
}

export function ConfirmDialog({
  isOpen,
  open,
  onOpenChange,
  onCancel,
  title,
  description,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  isDestructive = true,
}: ConfirmDialogProps) {
  // Unify the open state from either prop
  const isVisible = open ?? isOpen ?? false;
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) onOpenChange(newOpen);
    if (!newOpen && onCancel) onCancel();
  };
  const displayText = description ?? message ?? '';

  return (
    <AlertDialogPrimitive.Root open={isVisible} onOpenChange={handleOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col space-y-2 text-center sm:text-left">
            <AlertDialogPrimitive.Title className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              <div className="flex items-center gap-2">
                {isDestructive && <AlertTriangle className="text-red-500" size={20} />}
                {title}
              </div>
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description className="text-sm text-slate-500 dark:text-slate-400">
              {displayText}
            </AlertDialogPrimitive.Description>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <AlertDialogPrimitive.Cancel asChild>
              <button
                className="mt-2 sm:mt-0 inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus:ring-slate-800 dark:focus:ring-offset-slate-950"
              >
                {cancelText}
              </button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <button
                onClick={onConfirm}
                className={cn(
                  "inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-slate-950",
                  isDestructive
                    ? "bg-red-500 hover:bg-red-600 focus:ring-red-500"
                    : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-600"
                )}
              >
                {confirmText}
              </button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
