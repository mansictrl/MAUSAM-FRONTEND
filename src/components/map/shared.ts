// Shared glassy-panel styling for the map overlay cards, so every overlay on
// the map reads as one system against the tiles underneath.
export const MAP_PANEL =
  "bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-zinc-800 rounded-[22px] shadow-2xl shadow-slate-900/10 dark:shadow-black/70 text-slate-900 dark:text-white";

/** Format a RainViewer frame timestamp (epoch seconds) as a short time label. */
export function formatFrameTime(epochSeconds?: number): string | null {
  if (!epochSeconds) return null;
  return new Date(epochSeconds * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
