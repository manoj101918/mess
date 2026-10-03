import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Status } from "../api";
import { useI18n } from "../i18n";

const BADGE: Record<Status, string> = {
  active: "bg-green-100 text-green-800",
  expiring: "bg-orange-100 text-orange-800",
  expired: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: Status }) {
  const { t } = useI18n();
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[status]}`}>
      {t(`status.${status}`)}
    </span>
  );
}

export function PageHeader({ title, back, right }: { title: string; back?: string; right?: ReactNode }) {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-10 flex min-h-14 items-center gap-2 border-b border-slate-200 bg-white/95 px-4 backdrop-blur">
      {back && (
        <Link to={back} aria-label={t("common.goBack")} className="-ml-2 flex h-12 w-12 items-center justify-center text-2xl">
          ←
        </Link>
      )}
      <h1 className="flex-1 truncate text-lg font-bold">{title}</h1>
      {right}
    </header>
  );
}

export function EmptyState({ icon, title, hint, action }: { icon: string; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-3 text-5xl" aria-hidden>
        {icon}
      </div>
      <p className="text-base font-semibold text-slate-800">{title}</p>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 font-semibold underline">
          {t("common.tryAgain")}
        </button>
      )}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
      <p className="text-sm">{label ?? t("common.loading")}</p>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-2 text-slate-600">{message}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button className="btn-secondary" onClick={onCancel} disabled={busy}>
            {t("common.cancel")}
          </button>
          <button className="btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? t("common.pleaseWait") : (confirmLabel ?? t("common.delete"))}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}
