-- ============================================================
-- Electric World — Chat History Table
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/rwwzsbuxfjmqavnnfqez/sql
-- ============================================================

-- Stores Volt AI conversation history per user for memory across sessions
CREATE TABLE IF NOT EXISTS public.chat_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS chat_history_user_idx ON public.chat_history(user_id, created_at DESC);

-- RLS: users can only access their own history
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own chat history"
  ON public.chat_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own chat history"
  ON public.chat_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own chat history"
  ON public.chat_history FOR DELETE USING (auth.uid() = user_id);
