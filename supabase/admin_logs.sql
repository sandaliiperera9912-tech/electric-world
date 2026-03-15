-- ============================================================
-- Electric World — Admin Audit Log
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/rwwzsbuxfjmqavnnfqez/sql
-- ============================================================

-- 1. Admin action log table
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id   UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  admin_name TEXT,                   -- stored at log time so it survives admin deletion
  action     TEXT NOT NULL,          -- 'create_product','update_product','delete_product','update_order_status'
  target_id  UUID,                   -- affected product/order UUID
  target_name TEXT,                  -- name of the product/order at log time
  details    JSONB DEFAULT '{}',     -- extra info e.g. { oldStatus: 'processing', newStatus: 'shipped' }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast dashboard queries
CREATE INDEX IF NOT EXISTS admin_logs_created_idx ON public.admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_logs_admin_idx   ON public.admin_logs(admin_id);

-- RLS: public read (admin panel has no Supabase Auth session)
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read admin logs"
  ON public.admin_logs FOR SELECT USING (true);

CREATE POLICY "Public insert admin logs"
  ON public.admin_logs FOR INSERT WITH CHECK (true);

-- 2. Track which admin created/updated each product
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_by  UUID REFERENCES public.admins(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_by  UUID REFERENCES public.admins(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT NOW();

-- 3. Track which admin last updated each order status
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.admins(id) ON DELETE SET NULL;
