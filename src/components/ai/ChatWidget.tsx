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
    <div className="flex items-center gap-2 bg-dark-bg/60 border border-dark-border rounded-xl p-2.5 text-xs">
      <div className="w-10 h-10 rounded-lg bg-dark-muted flex items-center justify-center shrink-0">
        <Zap className="w-4 h-4 text-text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary truncate">{product.name}</p>
        <p className="text-blue-400 font-semibold">{formatPrice(product.price)}</p>
      </div>
      <button
        onClick={() => addItem(product)}
        className="shrink-0 p-1.5 rounded-lg bg-blue-500/15 border border-blue-500/20 text-blue-400 hover:bg-blue-500/25 transition-all"
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
      // Build message history for OpenAI
      const history: OpenAI.Chat.ChatCompletionMessageParam[] = messages
        .filter(m => m.id !== 'init')
        .map(m => ({ role: m.role, content: m.content }))
      history.push({ role: 'user', content: trimmed })

      const response = await openaiClient.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
        tools: AI_TOOLS,
        tool_choice: 'auto',
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
      })

      const choice = response.choices[0]

      // Handle tool calls
      if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
        const toolHistory: OpenAI.Chat.ChatCompletionMessageParam[] = [
          ...history,
          choice.message,
        ]

        let productResults: Product[] | undefined

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

          // Capture search results for rendering
          if (toolCall.function.name === 'search_products' && result.success && Array.isArray(result.data)) {
            productResults = result.data as Product[]
          }

          // Handle redirect action
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

          toolHistory.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          })
        }

        // Get final reply after tool results
        const finalResponse = await openaiClient.chat.completions.create({
          model: AI_MODEL,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...toolHistory],
          max_tokens: MAX_TOKENS,
          temperature: TEMPERATURE,
        })

        const finalContent = finalResponse.choices[0].message.content || ''

        setIsTyping(false)
        setMessages(prev => [...prev, {
          id: generateId(),
          role: 'assistant',
          content: finalContent,
          timestamp: new Date(),
          productResults,
        }])
      } else {
        // Direct text response
        const content = choice.message.content || "I'm sorry, I couldn't generate a response. Please try again."
        setIsTyping(false)
        setMessages(prev => [...prev, {
          id: generateId(), role: 'assistant', content, timestamp: new Date(),
        }])
      }
    } catch (err) {
      console.error('AI error:', err)
      setIsTyping(false)
      // Fall back to keyword matching
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
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all duration-200 active:scale-95"
        aria-label="Toggle Volt AI chat"
      >
        {isOpen ? (
          <ChevronDown className="w-6 h-6 text-white" />
        ) : (
          <Zap className="w-6 h-6 text-white" strokeWidth={2.5} />
        )}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-dark-bg animate-pulse" />
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-40 w-[358px] h-[520px] flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-dark-border animate-slide-up"
          style={{ background: '#07070d' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border bg-gradient-to-r from-blue-500/10 to-purple-500/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-heading font-semibold text-text-primary text-sm">Volt AI</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-xs text-green-400">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasOpenAI && (
                <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">GPT-4o</span>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-text-muted hover:text-text-primary hover:bg-dark-muted rounded-lg transition-all"
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
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-2 mt-1 shrink-0">
                    <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                  </div>
                )}
                <div className="max-w-[82%] space-y-2">
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-white text-gray-900 rounded-tr-sm'
                        : 'bg-dark-muted border border-dark-border text-text-primary rounded-tl-sm'
                    }`}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  />
                  {/* Mini product cards */}
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
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
                <div className="bg-dark-muted border border-dark-border rounded-2xl rounded-tl-sm px-4 py-3">
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
          <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide border-t border-dark-border/50">
            {QUICK_REPLIES.map(reply => (
              <button
                key={reply}
                onClick={() => sendMessage(reply)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-dark-border text-text-secondary hover:text-text-primary hover:border-blue-500/40 hover:bg-blue-500/5 transition-all whitespace-nowrap"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-dark-border flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputValue) } }}
              placeholder="Ask Volt AI anything..."
              className="flex-1 bg-dark-muted border border-dark-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                inputValue.trim()
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-dark-muted text-text-muted cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
