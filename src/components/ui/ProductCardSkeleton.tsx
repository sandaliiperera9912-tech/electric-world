export default function ProductCardSkeleton() {
  return (
    <div
      className="rounded-card p-4 flex flex-col gap-3 animate-pulse bg-white"
      style={{ border: '1px solid #D9E1EB', boxShadow: '0 2px 12px rgba(0,28,63,0.06)' }}
    >
      <div className="h-44 rounded-xl" style={{ background: '#EEF2F7' }} />
      <div className="h-3 w-16 rounded-full" style={{ background: '#EEF2F7' }} />
      <div className="h-4 w-3/4 rounded-full" style={{ background: '#EEF2F7' }} />
      <div className="h-3 w-full rounded-full" style={{ background: '#EEF2F7' }} />
      <div className="h-3 w-2/3 rounded-full" style={{ background: '#EEF2F7' }} />
      <div className="h-3 w-24 rounded-full" style={{ background: '#EEF2F7' }} />
      <div className="flex items-center justify-between pt-2 mt-auto" style={{ borderTop: '1px solid #D9E1EB' }}>
        <div className="h-5 w-16 rounded-full" style={{ background: '#EEF2F7' }} />
        <div className="h-8 w-24 rounded-xl" style={{ background: '#EEF2F7' }} />
      </div>
    </div>
  )
}
