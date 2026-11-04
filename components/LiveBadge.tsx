// Point rouge qui pulse : repère visuel immédiat des matchs en cours.
export default function LiveBadge({ label = "Live" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-live">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-live" />
      </span>
      {label}
    </span>
  );
}
