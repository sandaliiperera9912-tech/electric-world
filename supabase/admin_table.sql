-- ============================================================
-- Electric World — Admins Table Setup
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/rwwzsbuxfjmqavnnfqez/sql
-- ============================================================

-- 1. Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert the admin record
--    Username: admin
--    Password: 123
INSERT INTO admins (username, password, full_name)
VALUES ('admin', '123', 'Admin User')
ON CONFLICT (username) DO UPDATE SET password = '123';

-- 3. Allow public read on admins table (needed for login check from browser)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow login check" ON admins
  FOR SELECT USING (true);

-- 4. Add is_admin to profiles (if not already added)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 5. RLS policies for products CRUD
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert products') THEN
    CREATE POLICY "Admins can insert products" ON products
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update products') THEN
    CREATE POLICY "Admins can update products" ON products
      FOR UPDATE USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete products') THEN
    CREATE POLICY "Admins can delete products" ON products
      FOR DELETE USING (true);
  END IF;
END $$;

-- 6. Storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read product images') THEN
    CREATE POLICY "Public read product images" ON storage.objects
      FOR SELECT USING (bucket_id = 'product-images');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can upload product images') THEN
    CREATE POLICY "Anyone can upload product images" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'product-images');
  END IF;
END $$;

-- 7. Allow admin orders page to read all orders (no Supabase auth needed)
CREATE POLICY "Public read all orders" ON public.orders
  FOR SELECT USING (true);

CREATE POLICY "Public read all order items" ON public.order_items
  FOR SELECT USING (true);

-- Done! Login with: admin / 123
