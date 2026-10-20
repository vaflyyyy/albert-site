import { STATUS_INFO, type BookingStatus } from "@/lib/booking-status";
import { cn } from "@/lib/cn";

const TONES = {
  waiting: "border-caramel/60 text-caramel-300 bg-caramel/10",
  ok: "border-emerald-400/50 text-emerald-300 bg-emerald-400/10",
  bad: "border-red-400/50 text-red-300 bg-red-400/10",
  info: "border-sky-300/50 text-sky-200 bg-sky-300/10",
  muted: "border-line text-mist bg-surface-2",
} as const;

/** Цвет сопровождается текстом — статус не передаётся только цветом. */
export function StatusBadge({ status }: { status: BookingStatus }) {
  const info = STATUS_INFO[status];
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm", TONES[info.tone])}>
      <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full bg-current", info.tone === "waiting" && "animate-pulse")} />
      {info.label}
    </span>
  );
}
