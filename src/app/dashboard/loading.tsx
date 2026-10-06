export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-white/10" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/90" />)}</div>
      <div className="h-64 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}
