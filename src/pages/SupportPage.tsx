import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, Mail, Zap, MessageCircle } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import ChatWidget from '@/components/ai/ChatWidget'
import { FAQ_DATA } from '@/lib/supportKnowledge'
import { cn } from '@/lib/utils'

const QUICK_SUPPORT = [
  { label: 'Track my order', emoji: '📦' },
  { label: 'Return an item', emoji: '↩️' },
  { label: 'Shipping times', emoji: '🚚' },
  { label: 'Warranty info', emoji: '🛡️' },
  { label: 'Payment issue', emoji: '💳' },
]

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-dark-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-dark-muted/30 transition-all"
        onClick={() => setOpen(prev => !prev)}
      >
        <span className="font-medium text-text-primary text-sm">{q}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-text-muted shrink-0 ml-3" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-muted shrink-0 ml-3" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-dark-border bg-dark-muted/10">
          <p className="text-text-secondary text-sm leading-relaxed pt-3">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function SupportPage() {
  const [activeCategory, setActiveCategory] = useState(FAQ_DATA[0].category)

  const openChatWithMessage = (message: string) => {
    const chatBtn = document.querySelector('[aria-label="Toggle Volt AI chat"]') as HTMLButtonElement
    if (chatBtn) {
      chatBtn.click()
      // Small delay then dispatch a custom event to pre-fill the message
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('volt-ai-message', { detail: message }))
      }, 300)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-4">
              <Zap className="w-4 h-4" strokeWidth={2.5} />
              AI-Powered Support
            </div>
            <h1 className="font-heading font-bold text-4xl text-text-primary mb-3">
              How can we help?
            </h1>
            <p className="text-text-secondary max-w-md mx-auto">
              Ask Volt AI for instant answers, or browse our FAQ below.
            </p>
          </div>

          {/* Chat CTA */}
          <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-8 flex items-center gap-5 flex-wrap">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
              <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h2 className="font-heading font-bold text-text-primary text-lg mb-1">Chat with Volt AI</h2>
              <p className="text-text-muted text-sm">Get instant answers 24/7. Volt AI can check your orders, explain policies, and help resolve issues.</p>
            </div>
            <button
              onClick={() => {
                const chatBtn = document.querySelector('[aria-label="Toggle Volt AI chat"]') as HTMLButtonElement
                chatBtn?.click()
              }}
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4" />
              Start Chat
            </button>
          </div>

          {/* Quick support topics */}
          <div className="mb-10">
            <h3 className="font-heading font-semibold text-text-primary mb-4">Common Topics</h3>
            <div className="flex flex-wrap gap-3">
              {QUICK_SUPPORT.map(topic => (
                <button
                  key={topic.label}
                  onClick={() => openChatWithMessage(topic.label)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-dark-card border border-dark-border rounded-xl text-sm text-text-secondary hover:text-text-primary hover:border-blue-500/30 hover:bg-blue-500/5 transition-all font-medium"
                >
                  <span>{topic.emoji}</span>
                  {topic.label}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="mb-12">
            <h2 className="font-heading font-bold text-2xl text-text-primary mb-6">Frequently Asked Questions</h2>

            {/* Category tabs */}
            <div className="flex gap-2 flex-wrap mb-6">
              {FAQ_DATA.map(section => (
                <button
                  key={section.category}
                  onClick={() => setActiveCategory(section.category)}
                  className={cn(
                    'px-4 py-2 rounded-pill text-sm font-medium border transition-all',
                    activeCategory === section.category
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'border-dark-border text-text-secondary hover:text-text-primary hover:border-white/20'
                  )}
                >
                  {section.category}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {FAQ_DATA.find(s => s.category === activeCategory)?.items.map(item => (
                <AccordionItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>

          {/* Email fallback */}
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 text-center">
            <Mail className="w-8 h-8 text-text-muted mx-auto mb-3" />
            <h3 className="font-heading font-semibold text-text-primary mb-1">Can't find your answer?</h3>
            <p className="text-text-muted text-sm mb-4">
              Our support team typically responds within 2–4 hours.
            </p>
            <a
              href="mailto:support@electricworld.com"
              className="btn-ghost inline-flex items-center gap-2 text-sm"
            >
              <Mail className="w-4 h-4" />
              support@electricworld.com
            </a>
          </div>

          {/* Quick links */}
          <div className="mt-8 flex flex-wrap gap-3 justify-center text-sm">
            {[
              { to: '/orders', label: 'My Orders' },
              { to: '/products', label: 'Browse Products' },
              { to: '/profile', label: 'My Account' },
            ].map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="text-text-muted hover:text-blue-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <ChatWidget />
    </div>
  )
}
