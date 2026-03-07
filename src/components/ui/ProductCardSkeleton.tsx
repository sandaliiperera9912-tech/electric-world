export default function ProductCardSkeleton() {
  return (
    <div className="bg-dark-card border border-dark-border rounded-card p-4 flex flex-col gap-3 animate-pulse">
      <div className="h-44 rounded-xl bg-dark-muted" />
      <div className="h-3 w-16 rounded-full bg-dark-muted" />
      <div className="h-4 w-3/4 rounded-full bg-dark-muted" />
      <div className="h-3 w-full rounded-full bg-dark-muted" />
      <div className="h-3 w-2/3 rounded-full bg-dark-muted" />
      <div className="h-3 w-24 rounded-full bg-dark-muted" />
      <div className="flex items-center justify-between pt-2 mt-auto border-t border-dark-border">
        <div className="h-5 w-16 rounded-full bg-dark-muted" />
        <div className="h-8 w-24 rounded-xl bg-dark-muted" />
      </div>
    </div>
  )
}
