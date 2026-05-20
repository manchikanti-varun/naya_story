export default function StoreLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-16 md:px-8">
      <div className="h-10 w-3/5 max-w-sm animate-pulse rounded-md bg-ivory-deep/25" />
      <div className="h-96 animate-pulse rounded-sm bg-ivory-deep/20" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-sm bg-ivory-deep/15" />
        ))}
      </div>
    </div>
  );
}
