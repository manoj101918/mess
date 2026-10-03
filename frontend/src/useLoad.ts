import { useCallback, useEffect, useState } from "react";

/** Fetch on mount (and when deps change). Also refreshes when the app comes back from WhatsApp. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(fn, deps);

  const reload = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      setError("");
      try {
        setData(await load());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [load],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && reload(true);
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reload]);

  return { data, setData, error, loading, reload };
}
