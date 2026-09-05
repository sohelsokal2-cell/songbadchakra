export function NewsCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-[var(--color-border)]">
      <div className="skeleton h-48 w-full" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-20 rounded" />
        <div className="skeleton h-5 w-full rounded" />
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-3 w-24 rounded" />
      </div>
    </div>
  )
}

export function FeaturedCardSkeleton() {
  return (
    <div className="skeleton rounded-xl h-96 w-full" />
  )
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="skeleton h-16 w-20 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-2/3 rounded" />
            <div className="skeleton h-3 w-20 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ArticleSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="skeleton h-6 w-24 rounded" />
      <div className="skeleton h-10 w-full rounded" />
      <div className="skeleton h-10 w-5/6 rounded" />
      <div className="skeleton h-64 w-full rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-4 w-full rounded" />
        ))}
      </div>
    </div>
  )
}
