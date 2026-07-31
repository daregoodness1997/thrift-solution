"use client";

import { useState, useRef, useCallback, ReactNode } from "react";
import { X, AlertTriangle, Trash2, CheckCircle, Info } from "lucide-react";

export type ConfirmVariant = "danger" | "warning" | "success" | "info" | "primary";

export interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  confirmValue?: string;
  confirmPlaceholder?: string;
}

interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

type Tone = "red" | "amber" | "emerald" | "blue";

interface ToneConfig {
  Icon: React.ComponentType<any>;
  bg: string;
  border: string;
  text: string;
  btn: string;
}

const VARIANT_CONFIG: Record<ConfirmVariant, ToneConfig> = {
  danger: {
    Icon: Trash2,
    bg: "bg-red-50 dark:bg-red-900/30",
    border: "border-red-200 dark:border-red-900/50",
    text: "text-red-600 dark:text-red-400",
    btn: "bg-red-600 hover:bg-red-700",
  },
  warning: {
    Icon: AlertTriangle,
    bg: "bg-amber-50 dark:bg-amber-900/30",
    border: "border-amber-200 dark:border-amber-900/50",
    text: "text-amber-600 dark:text-amber-400",
    btn: "bg-amber-600 hover:bg-amber-700",
  },
  success: {
    Icon: CheckCircle,
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    border: "border-emerald-200 dark:border-emerald-900/50",
    text: "text-emerald-600 dark:text-emerald-400",
    btn: "bg-emerald-600 hover:bg-emerald-700",
  },
  info: {
    Icon: Info,
    bg: "bg-blue-50 dark:bg-blue-900/30",
    border: "border-blue-200 dark:border-blue-900/50",
    text: "text-blue-600 dark:text-blue-400",
    btn: "bg-blue-600 hover:bg-blue-700",
  },
  primary: {
    Icon: CheckCircle,
    bg: "bg-blue-50 dark:bg-blue-900/30",
    border: "border-blue-200 dark:border-blue-900/50",
    text: "text-blue-600 dark:text-blue-400",
    btn: "bg-blue-600 hover:bg-blue-700",
  },
};

const CANCEL_BTN =
  "flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700";
const CONFIRM_BTN =
  "flex-1 rounded-full px-4 py-2.5 text-[12px] font-semibold text-white disabled:opacity-50 transition-colors";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "info",
  loading = false,
  confirmValue,
  confirmPlaceholder = "Type to confirm...",
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) return null;
  const cfg = VARIANT_CONFIG[variant];
  const [typed, setTyped] = useState("");
  const disabled = loading || (confirmValue ? typed !== confirmValue : false);

  const handleConfirm = async () => {
    if (disabled) return;
    await onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:bg-slate-900 border ${cfg.border}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.bg} ${cfg.text}`}>
            <cfg.Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
            {description && (
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
            )}
          </div>
        </div>

        {confirmValue && (
          <div className="mt-5">
            <label className="mb-1.5 block text-[10px] uppercase tracking-[0.05em] text-slate-500 dark:text-slate-400">
              Type <span className="font-semibold">{confirmValue}</span> to confirm
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={confirmPlaceholder}
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] text-slate-900 outline-none transition-colors focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400 disabled:cursor-not-allowed"
            />
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} disabled={loading} className={CANCEL_BTN}>
            {cancelLabel}
          </button>
          <button onClick={handleConfirm} disabled={disabled} className={`${CONFIRM_BTN} ${cfg.btn}`}>
            {loading ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions>({ title: "" });
  const pendingRef = useRef<{ resolve: (v: boolean) => void } | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setOpts(options);
      pendingRef.current = { resolve };
      setOpen(true);
    });
  }, []);

  const handleConfirm = () => {
    pendingRef.current?.resolve(true);
    setOpen(false);
  };

  const handleClose = () => {
    pendingRef.current?.resolve(false);
    setOpen(false);
  };

  const Dialog = (
    <ConfirmDialog
      open={open}
      title={opts.title}
      description={opts.description}
      confirmLabel={opts.confirmLabel}
      cancelLabel={opts.cancelLabel}
      variant={opts.variant}
      loading={opts.loading}
      confirmValue={opts.confirmValue}
      confirmPlaceholder={opts.confirmPlaceholder}
      onClose={handleClose}
      onConfirm={handleConfirm}
    />
  );

  return { confirm, Dialog };
}
