export default function Loading() {
  return (
    <div className="py-6">
      <div className="animate-pulse">
        <div className="h-7 w-40 bg-muted rounded mb-6" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
