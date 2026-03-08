import { useState, useRef, useEffect } from 'react'
import { Zap, X, Send, ChevronDown, ShoppingCart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { openaiClient, AI_MODEL, MAX_TOKENS, TEMPERATURE, SYSTEM_PROMPT } from '@/lib/openai'
import { AI_TOOLS } from '@/lib/aiTools'
import { executeToolCall } from '@/lib/toolExecutor'
import { getBotReply } from '@/lib/voltBot'
import { generateId, formatPrice } from '@/lib/utils'
import { useAuth } from '@/store/authContext'
import { useCart } from '@/store/cartContext'
import type { ChatMessage, Product } from '@/types'
import type OpenAI from 'openai'

// Persistent tool-aware conversation history (survives re-renders)
let fullConversationHistory: OpenAI.Chat.ChatCompletionMessageParam[] = []

const QUICK_REPLIES = [
  'Best laptops under $1500',
  'Headphones under $300',
  'Shipping times',
  'Returns policy',
  'Top deals today',
]

const INITIAL_MESSAGE: ChatMessage = {
  id: 'init',
  role: 'assistant',
  content:
    "Hey there! ⚡ I'm **Volt AI**, your smart shopping assistant. I can help you find electronics, add items to cart, track orders, and more. What can I help you with today?",
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
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <Zap className="w-4 h-4 text-white/40" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{product.name}</p>
        <p className="text-brand-red font-semibold">{formatPrice(product.price)}</p>
      </div>
      <button
        onClick={() => addItem(product)}
        className="shrink-0 p-1.5 rounded-lg transition-all hover:scale-105 active:scale-95"
        style={{ background: 'rgba(227,26,45,0.2)', border: '1px solid rgba(227,26,45,0.3)', color: '#fca5a5' }}
      >
        <ShoppingCart className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const { cartItems, addItem } = useCart()
  const navigate = useNavigate()

  const hasOpenAI = !!import.meta.env.VITE_OPENAI_API_KEY

  // Reset persistent history when messages are cleared
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'init') {
      fullConversationHistory = []
    }
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

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
      // Use the persistent full history (includes tool call messages for context)
      fullConversationHistory.push({ role: 'user', content: trimmed })

      // Multi-round tool calling loop (up to 5 rounds so AI can search → then add to cart)
      const loopMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [...fullConversationHistory]
      let productResults: Product[] | undefined
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

        // No more tool calls — final text response
        if (choice.finish_reason !== 'tool_calls' || !choice.message.tool_calls) {
          const content = choice.message.content || "I'm sorry, I couldn't generate a response. Please try again."
          // Save final assistant reply to persistent history
          fullConversationHistory = loopMessages
          setIsTyping(false)
          setMessages(prev => [...prev, {
            id: generateId(),
            role: 'assistant',
            content,
            timestamp: new Date(),
            productResults,
          }])
          return
        }

        // Execute each tool call
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

          // Capture product search results for mini-card rendering
          if (toolCall.function.name === 'search_products' && result.success && Array.isArray(result.data)) {
            productResults = result.data as Product[]
          }

          // Handle redirect immediately
          if (result.action === 'redirect' && result.path) {
            setIsTyping(false)
            setMessages(prev => [...prev, {
              id: generateId(),
              role: 'assistant',
              content: result.message || 'Taking you to checkout!',
              timestamp: new Date(),
            }])
            setTimeout(() => navigate(result.path!), 1200)
            return
          }

          loopMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          })
        }
        // Loop continues — AI will see tool results and can call more tools or reply
      }

      // Safety fallback if loop exhausted
      setIsTyping(false)
      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'assistant',
        content: "I've completed your request!",
        timestamp: new Date(),
        productResults,
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
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-200 active:scale-95"
        style={{
          background: '#E31A2D',
          boxShadow: '0 4px 20px rgba(227,26,45,0.45)',
        }}
        aria-label="Toggle Volt AI chat"
      >
        {isOpen ? (
          <ChevronDown className="w-6 h-6 text-white" />
        ) : (
          <Zap className="w-6 h-6 text-white" strokeWidth={2.5} />
        )}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-navy rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-40 w-[358px] h-[520px] flex flex-col rounded-2xl overflow-hidden shadow-2xl animate-slide-up"
          style={{ background: '#0A1929', border: '1px solid rgba(255,255,255,0.08)' }}
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
                  <span className="text-xs text-green-400">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasOpenAI && (
                <span className="text-[10px] text-white/60 bg-white/10 border border-white/15 px-2 py-0.5 rounded-full">GPT-4o</span>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center mr-2 mt-1 shrink-0"
                    style={{ background: '#E31A2D' }}
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
                    }`}
                    style={
                      msg.role === 'user'
                        ? { background: '#FFFFFF' }
                        : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }
                    }
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  />
                  {msg.productResults && msg.productResults.length > 0 && (
                    <div className="space-y-1.5">
                      {msg.productResults.slice(0, 4).map(p => (
                        <MiniProductCard key={p.id} product={p} />
                      ))}
                    </div>
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
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
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
