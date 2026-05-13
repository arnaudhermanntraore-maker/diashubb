import { Skeleton } from "@/components/ui/skeleton";

export function LoadingDashboard() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <Skeleton className="h-8 w-64 mb-2" />
      <Skeleton className="h-4 w-40" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
      <Skeleton className="h-64 rounded-2xl mt-8" />
    </div>
  );
}
