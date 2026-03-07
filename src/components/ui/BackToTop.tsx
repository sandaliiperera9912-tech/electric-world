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
      className="fixed bottom-24 right-24 z-30 w-10 h-10 bg-dark-card border border-dark-border rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:border-white/20 transition-all shadow-lg animate-fade-in"
      aria-label="Back to top"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  )
}
