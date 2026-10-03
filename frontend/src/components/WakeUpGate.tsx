import { useEffect, useState, type ReactNode } from "react";
import { api } from "../api";
import { useI18n, type TKey } from "../i18n";

const MESSAGES: TKey[] = ["wake.1", "wake.2", "wake.3", "wake.4"];

/** Free hosts sleep when idle. Keep pinging /health and show a friendly screen until it answers. */
export function WakeUpGate({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let attempt = 0; !cancelled; attempt++) {
        try {
          await api.health();
          if (!cancelled) setReady(true);
          return;
        } catch {
          await new Promise((r) => setTimeout(r, Math.min(1000 + attempt * 500, 4000)));
        }
      }
    })();
    const timer = setInterval(() => setTick((t) => t + 1), 3500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (ready) return <>{children}</>;
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-brand-700 px-8 text-center text-white">
      <div className="mb-6 text-7xl" aria-hidden>
        🍛
      </div>
      <h1 className="text-2xl font-bold">Mess Book</h1>
      <div className="mt-8 h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
      <p className="mt-6 text-base text-white/90">{t(MESSAGES[Math.min(tick, MESSAGES.length - 1)])}</p>
      {tick >= 12 && (
        <p className="mt-3 text-sm text-white/70">{t("wake.slow")}</p>
      )}
    </div>
  );
}
