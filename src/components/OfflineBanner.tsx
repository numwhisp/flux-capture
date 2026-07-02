import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";

/**
 * Persistent offline banner. Shows a fixed top bar whenever the browser
 * reports it is offline, with a Retry button that forces a lightweight
 * network probe. Stays visible until connectivity is restored.
 */
export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setOnline(navigator.onLine);
    const goOnline = () => {
      setOnline(true);
      toast.success("You're back online");
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  async function retry() {
    setChecking(true);
    try {
      // Probe a tiny same-origin asset to force a real network check.
      await fetch("/favicon.ico", { cache: "no-store", method: "HEAD" });
      setOnline(true);
      toast.success("You're back online");
    } catch {
      setOnline(false);
      toast.error("Still offline", { description: "Check your connection and try again." });
    } finally {
      setChecking(false);
    }
  }

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[100] border-b border-rose-500/30 bg-rose-950/95 px-4 py-2 text-rose-100 backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span className="font-medium">You're offline.</span>
          <span className="text-rose-200/80">Changes won't sync until your connection is restored.</span>
        </div>
        <button
          onClick={retry}
          disabled={checking}
          className="inline-flex items-center gap-1.5 rounded-md border border-rose-400/40 bg-rose-500/20 px-2.5 py-1 text-xs font-semibold text-rose-50 transition-colors hover:bg-rose-500/30 disabled:opacity-60"
        >
          <RefreshCw className={`h-3 w-3 ${checking ? "animate-spin" : ""}`} />
          {checking ? "Checking…" : "Retry"}
        </button>
      </div>
    </div>
  );
}