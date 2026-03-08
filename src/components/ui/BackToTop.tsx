import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-24 right-24 z-30 w-10 h-10 bg-white rounded-full flex items-center justify-center text-text-muted hover:text-brand-navy transition-all animate-fade-in"
      style={{ border: '1px solid #D9E1EB', boxShadow: '0 2px 12px rgba(0,28,63,0.10)' }}
      aria-label="Back to top"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  )
}
