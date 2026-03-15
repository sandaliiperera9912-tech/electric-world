import { useCallback } from 'react'
import { supabase } from './supabase'

interface AdminSession {
  id: string
  username: string
  fullName: string
}

function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem('ew_admin_session')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

type AdminAction =
  | 'create_product'
  | 'update_product'
  | 'delete_product'
  | 'update_order_status'

interface LogPayload {
  action: AdminAction
  targetId?: string
  targetName?: string
  details?: Record<string, unknown>
}

export function useAdminLog() {
  const logAction = useCallback(async ({ action, targetId, targetName, details = {} }: LogPayload) => {
    const session = getAdminSession()
    try {
      await supabase.from('admin_logs').insert({
        admin_id:    session?.id   ?? null,
        admin_name:  session?.fullName ?? session?.username ?? 'Admin',
        action,
        target_id:   targetId   ?? null,
        target_name: targetName ?? null,
        details,
      })
    } catch {
      // Logging failure should never block the main operation
    }
  }, [])

  return { logAction }
}
