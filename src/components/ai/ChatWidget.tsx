import { useState, useRef, useEffect, useCallback } from 'react'
import { Zap, X, Send, ChevronDown, ShoppingCart, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { openaiClient, AI_MODEL, MAX_TOKENS, TEMPERATURE, SYSTEM_PROMPT } from '@/lib/openai'
import { AI_TOOLS } from '@/lib/aiTools'
import { executeToolCall } from '@/lib/toolExecutor'
import { getBotReply } from '@/lib/voltBot'
import { generateId, formatPrice } from '@/lib/utils'
import { useAuth } from '@/store/authContext'
import { useCart } from '@/store/cartContext'
import { supabase } from '@/lib/supabase'
import type { ChatMessage, Product } from '@/types'
import type OpenAI from 'openai'

// Persistent tool-aware conversation history (survives re-renders, reset on clear)
let fullConversationHistory: OpenAI.Chat.ChatCompletionMessageParam[] = []

const QUICK_REPLIES = [
  'Best laptops under $1500',
  'Headphones under $300',
  'Where is my order?',
  'Compare Sony XM5 vs Bose QC Ultra',
  'Top deals today',
]

const INITIAL_MESSAGE: ChatMessage = {
  id: 'init',
  role: 'assistant',
  content:
    "Hey there! ⚡ I'm **Volt AI**, your smart shopping assistant. I can help you find electronics, compare products, add items to cart, and track your orders. What can I help you with today?",
  timestamp: new Date(),
}

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />')
}

function MiniProductCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  return (
    <div
      className="flex items-center gap-2 rounded-xl p-2.5 text-xs"
      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
    >
      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        {product.images?.[0]
          ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          : <Zap className="w-4 h-4 text-white/40" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{product.name}</p>
        <p className="text-brand-red font-semibold">{formatPrice(product.price)}</p>
      </div>
      <button
        onClick={() => addItem(product)}
        className="shrink-0 p-1.5 rounded-lg transition-all hover:scale-105 active:scale-95"
        style={{ background: 'rgba(227,26,45,0.2)', border: '1px solid rgba(227,26,45,0.3)', color: '#fca5a5' }}
        title="Add to cart"
      >
        <ShoppingCart className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function ComparisonCard({ products }: { products: Product[] }) {
  const { addItem } = useCart()
  return (
    <div className="mt-2 overflow-x-auto">
      <div className="flex gap-2 min-w-max">
        {products.map((p, i) => (
          <div
            key={p.id}
            className="w-40 rounded-xl p-3 text-xs flex flex-col gap-2"
            style={{
              background: i === 0 ? 'rgba(227,26,45,0.12)' : 'rgba(255,255,255,0.07)',
              border: `1px solid ${i === 0 ? 'rgba(227,26,45,0.35)' : 'rgba(255,255,255,0.12)'}`,
            }}
          >
            {i === 0 && (
              <span className="text-[10px] font-bold text-brand-red uppercase tracking-wide">⚡ Best Pick</span>
            )}
            <div className="w-full h-16 rounded-lg overflow-hidden flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              {p.images?.[0]
                ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                : <Zap className="w-6 h-6 text-white/20" />}
            </div>
            <p className="font-semibold text-white leading-tight line-clamp-2">{p.name}</p>
            <div className="space-y-1 text-white/60">
              <p className="text-brand-red font-bold text-sm">{formatPrice(p.price)}</p>
              <p>⭐ {p.rating ?? 'N/A'}</p>
              <p className="capitalize">{p.category}</p>
            </div>
            <button
              onClick={() => addItem(p)}
              className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold mt-auto transition-all active:scale-95"
              style={{ background: 'rgba(227,26,45,0.25)', color: '#fca5a5', border: '1px solid rgba(227,26,45,0.3)' }}
            >
              <ShoppingCart className="w-3 h-3" />
              Add
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [memoryLoaded, setMemoryLoaded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const { cartItems, addItem } = useCart()
  const navigate = useNavigate()

  const hasOpenAI = !!import.meta.env.VITE_OPENAI_API_KEY

  // ── Load chat memory from Supabase when user opens chat ──
  const loadMemory = useCallback(async () => {
    if (!user || memoryLoaded) return
    setMemoryLoaded(true)
    try {
      const { data } = await supabase
        .from('chat_history')
        .select('role, content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (!data || data.length === 0) return

      // Reverse so oldest first, build persistent history for AI context
      const history = [...data].reverse()
      fullConversationHistory = history.map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      }))

      // Show last 6 messages in UI as "memory" context
      const recent = history.slice(-6)
      const memoryMessages: ChatMessage[] = recent.map(h => ({
        id: generateId(),
        role: h.role as 'user' | 'assistant',
        content: h.content,
        timestamp: new Date(h.created_at),
        isMemory: true,
      }))

      if (memoryMessages.length > 0) {
        setMessages([
          INITIAL_MESSAGE,
          {
            id: 'memory-divider',
            role: 'assistant',
            content: `📖 *Continuing from your last session...*`,
            timestamp: new Date(),
            isMemory: true,
          },
          ...memoryMessages,
        ])
      }
    } catch {
      // Memory load failed silently — fresh session
    }
  }, [user, memoryLoaded])

  // ── Save a message to Supabase ──
  const saveToMemory = useCallback(async (role: 'user' | 'assistant', content: string) => {
    if (!user) return
    try {
      await supabase.from('chat_history').insert({ user_id: user.id, role, content })
    } catch { /* silent */ }
  }, [user])

  // ── Reset history when messages cleared ──
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'init') {
      fullConversationHistory = []
      setMemoryLoaded(false)
    }
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false)
      setTimeout(() => inputRef.current?.focus(), 100)
      loadMemory()
    }
  }, [isOpen, loadMemory])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const clearChat = async () => {
    if (user) {
      try {
        await supabase.from('chat_history').delete().eq('user_id', user.id)
      } catch { /* silent */ }
    }
    fullConversationHistory = []
    setMemoryLoaded(false)
    setMessages([INITIAL_MESSAGE])
  }

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInputValue('')
    setIsTyping(true)

    if (!hasOpenAI) {
      await new Promise(r => setTimeout(r, 600 + Math.random() * 600))
      const reply = getBotReply(trimmed)
      setIsTyping(false)
      setMessages(prev => [...prev, {
        id: generateId(), role: 'assistant', content: reply, timestamp: new Date(),
      }])
      return
    }

    try {
      fullConversationHistory.push({ role: 'user', content: trimmed })
      await saveToMemory('user', trimmed)

      const loopMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [...fullConversationHistory]
      let productResults: Product[] | undefined
      let comparisonProducts: Product[] | undefined
      const MAX_ROUNDS = 5

      for (let round = 0; round < MAX_ROUNDS; round++) {
        const response = await openaiClient.chat.completions.create({
          model: AI_MODEL,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...loopMessages],
          tools: AI_TOOLS,
          tool_choice: 'auto',
          max_tokens: MAX_TOKENS,
          temperature: TEMPERATURE,
        })

        const choice = response.choices[0]
        loopMessages.push(choice.message)

        if (choice.finish_reason !== 'tool_calls' || !choice.message.tool_calls) {
          const content = choice.message.content || "I'm sorry, I couldn't generate a response. Please try again."
          fullConversationHistory = loopMessages
          await saveToMemory('assistant', content)

          setIsTyping(false)
          setMessages(prev => [...prev, {
            id: generateId(),
            role: 'assistant',
            content,
            timestamp: new Date(),
            productResults,
            comparisonProducts,
          }])
          return
        }

        for (const toolCall of choice.message.tool_calls) {
          if (toolCall.type !== 'function') continue

          const args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>
          const result = await executeToolCall(
            toolCall.function.name,
            args,
            user?.id || null,
            cartItems,
            addItem
          )

          if (toolCall.function.name === 'search_products' && result.success && Array.isArray(result.data)) {
            productResults = result.data as Product[]
          }

          if (toolCall.function.name === 'compare_products' && result.success && result.data) {
            const d = result.data as { products?: Product[]; isComparison?: boolean }
            if (d.isComparison && d.products) comparisonProducts = d.products
          }

          if (result.action === 'redirect' && result.path) {
            setIsTyping(false)
            const redirectMsg = result.message || 'Taking you to checkout!'
            setMessages(prev => [...prev, {
              id: generateId(), role: 'assistant', content: redirectMsg, timestamp: new Date(),
            }])
            await saveToMemory('assistant', redirectMsg)
            setTimeout(() => navigate(result.path!), 1200)
            return
          }

          loopMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          })
        }
      }

      setIsTyping(false)
      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'assistant',
        content: "I've completed your request!",
        timestamp: new Date(),
        productResults,
        comparisonProducts,
      }])

    } catch (err) {
      console.error('AI error:', err)
      setIsTyping(false)
      const reply = getBotReply(trimmed)
      setMessages(prev => [...prev, {
        id: generateId(), role: 'assistant', content: reply, timestamp: new Date(),
      }])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-6 left-6 z-40 w-16 h-16 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-200 active:scale-95"
        style={{ background: '#E31A2D', boxShadow: '0 4px 20px rgba(227,26,45,0.45)' }}
        aria-label="Toggle Volt AI chat"
      >
        {isOpen ? (
          <ChevronDown className="w-7 h-7 text-white" />
        ) : (
          <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
        )}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-navy rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div
          className="fixed bottom-28 left-6 z-40 w-[390px] flex flex-col rounded-2xl overflow-hidden shadow-2xl animate-slide-up"
          style={{ height: 'min(560px, calc(100vh - 200px))', background: '#0A1929', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#102E5A' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-md"
                style={{ background: '#E31A2D' }}
              >
                <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-heading font-semibold text-white text-sm">Volt AI</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-xs text-green-400">
                    {user ? 'Memory On' : 'Online'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasOpenAI && (
                <span className="text-[10px] text-white/60 bg-white/10 border border-white/15 px-2 py-0.5 rounded-full">GPT-4o</span>
              )}
              <button
                onClick={clearChat}
                className="p-1.5 text-white/40 hover:text-white/70 hover:bg-white/10 rounded-lg transition-all"
                title="Clear chat history"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 scrollbar-hide"
            onWheel={e => e.stopPropagation()}
            onTouchMove={e => e.stopPropagation()}
          >
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center mr-2 mt-1 shrink-0"
                    style={{ background: (msg as ChatMessage & { isMemory?: boolean }).isMemory ? 'rgba(227,26,45,0.4)' : '#E31A2D' }}
                  >
                    <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                  </div>
                )}
                <div className="max-w-[82%] space-y-2">
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'text-brand-navy rounded-tr-sm font-medium'
                        : 'text-white/90 rounded-tl-sm'
                    } ${(msg as ChatMessage & { isMemory?: boolean }).isMemory ? 'opacity-60' : ''}`}
                    style={
                      msg.role === 'user'
                        ? { background: '#FFFFFF' }
                        : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }
                    }
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  />

                  {/* Product search results */}
                  {(msg as ChatMessage & { productResults?: Product[] }).productResults?.length! > 0 && (
                    <div className="space-y-1.5">
                      {(msg as ChatMessage & { productResults?: Product[] }).productResults!.slice(0, 4).map(p => (
                        <MiniProductCard key={p.id} product={p} />
                      ))}
                    </div>
                  )}

                  {/* Comparison cards */}
                  {(msg as ChatMessage & { comparisonProducts?: Product[] }).comparisonProducts?.length! > 0 && (
                    <ComparisonCard products={(msg as ChatMessage & { comparisonProducts?: Product[] }).comparisonProducts!} />
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start items-end gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: '#E31A2D' }}
                >
                  <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
                <div
                  className="rounded-2xl rounded-tl-sm px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex gap-1 items-center h-4">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick reply chips */}
          <div
            className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            {QUICK_REPLIES.map(reply => (
              <button
                key={reply}
                onClick={() => sendMessage(reply)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-full transition-all whitespace-nowrap text-white/60 hover:text-white"
                style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'transparent' }}
                onMouseEnter={e => {
                  (e.target as HTMLButtonElement).style.borderColor = 'rgba(227,26,45,0.5)'
                  ;(e.target as HTMLButtonElement).style.background = 'rgba(227,26,45,0.1)'
                }}
                onMouseLeave={e => {
                  (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)'
                  ;(e.target as HTMLButtonElement).style.background = 'transparent'
                }}
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="px-4 py-3 flex gap-2 items-center"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputValue) } }}
              placeholder="Ask Volt AI anything..."
              className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(227,26,45,0.4)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.10)' }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95"
              style={
                inputValue.trim()
                  ? { background: '#E31A2D', color: 'white', boxShadow: '0 2px 10px rgba(227,26,45,0.4)' }
                  : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', cursor: 'not-allowed' }
              }
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
