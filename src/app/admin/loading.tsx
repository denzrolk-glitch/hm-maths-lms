export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div>
      <div className="h-64 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
