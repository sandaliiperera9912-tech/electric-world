import { supabase } from './supabase'

/**
 * Track an add-to-cart event
 */
export function trackAddToCart(productId: string, price: number) {
  const events: { name: string; productId: string; price: number; timestamp: string }[] =
    JSON.parse(localStorage.getItem('ew_events') || '[]')
  events.push({ name: 'add_to_cart', productId, price, timestamp: new Date().toISOString() })
  if (events.length > 100) events.splice(0, events.length - 100)
  localStorage.setItem('ew_events', JSON.stringify(events))
}

/**
 * Track checkout funnel steps
 */
export function trackCheckoutStep(step: 'cart_view' | 'checkout_start' | 'payment_success') {
  const events: { name: string; step: string; timestamp: string }[] =
    JSON.parse(localStorage.getItem('ew_checkout_events') || '[]')
  events.push({ name: 'checkout_funnel', step, timestamp: new Date().toISOString() })
  localStorage.setItem('ew_checkout_events', JSON.stringify(events))
}

/**
 * Track a search query — especially zero-result searches for product gap analysis
 */
export function trackSearch(query: string, resultCount: number) {
  if (resultCount === 0) {
    const zeroResults: { query: string; timestamp: string }[] =
      JSON.parse(localStorage.getItem('ew_zero_results') || '[]')
    zeroResults.push({ query, timestamp: new Date().toISOString() })
    localStorage.setItem('ew_zero_results', JSON.stringify(zeroResults))
  }
}

/**
 * Log an AI tool call to Supabase ai_logs table
 */
export async function logAIToolCall(
  toolName: string,
  userId: string | null,
  success: boolean,
  latencyMs: number
) {
  try {
    await supabase.from('ai_logs').insert({
      tool_name: toolName,
      user_id: userId,
      success,
      latency_ms: latencyMs,
    })
  } catch {
    // Non-critical — don't throw
  }
}

/**
 * Log an unresolved support query
 */
export async function logSupportQuery(message: string, userId: string | null) {
  try {
    await supabase.from('support_logs').insert({
      message,
      user_id: userId,
      resolved: false,
    })
  } catch {
    // Non-critical
  }
}

/**
 * Track AI chat engagement
 */
export function trackAIChatSession(event: 'opened' | 'message_sent' | 'tool_triggered') {
  const stats: Record<string, number> = JSON.parse(localStorage.getItem('ew_ai_stats') || '{}')
  stats[event] = (stats[event] || 0) + 1
  localStorage.setItem('ew_ai_stats', JSON.stringify(stats))
}
