import { Progress } from "../api/client";

const COLOR: Record<Progress, string> = {
  pending: "bg-gray-300",
  processing: "bg-amber-400",
  done: "bg-emerald-500",
  failed: "bg-rose-500",
};

export function StatusLight({ label, status }: { label: string; status: Progress }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-600">
      <span className={`h-2.5 w-2.5 rounded-full ${COLOR[status]}`} />
      <span>{label}</span>
    </div>
  );
}
