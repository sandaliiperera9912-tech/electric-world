-- ============================================================
-- Electric World — Admin Setup SQL
-- Run this ONCE in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/rwwzsbuxfjmqavnnfqez/sql
-- ============================================================

-- 1. Add is_admin flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- ============================================================
-- 2. Create admin user account
--    Email:    admin@electricworld.com
--    Password: 123
-- ============================================================
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN
  -- Only create if not already exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@electricworld.com'
  ) THEN

    -- Create the auth user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'admin@electricworld.com',
      crypt('123', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"username":"admin"}',
      false,
      NOW(),
      NOW(),
      '',
      ''
    );

    -- Create the identity record (required for email login)
    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      new_user_id,
      'admin@electricworld.com',
      jsonb_build_object(
        'sub', new_user_id::text,
        'email', 'admin@electricworld.com',
        'email_verified', true
      ),
      'email',
      NOW(),
      NOW(),
      NOW()
    );

    -- Create the profile with admin privileges
    INSERT INTO profiles (id, username, full_name, is_admin, created_at)
    VALUES (new_user_id, 'admin', 'Admin', true, NOW())
    ON CONFLICT (id) DO UPDATE SET is_admin = true, username = 'admin';

    RAISE NOTICE 'Admin user created: admin@electricworld.com / 123';

  ELSE
    -- User already exists — just make sure they have admin privileges
    UPDATE profiles
    SET is_admin = true
    WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@electricworld.com');

    RAISE NOTICE 'Admin privileges granted to existing user: admin@electricworld.com';
  END IF;
END $$;

-- ============================================================
-- 3. RLS policies — allow admins to manage products
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert products'
  ) THEN
    CREATE POLICY "Admins can insert products"
      ON products FOR INSERT
      WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update products'
  ) THEN
    CREATE POLICY "Admins can update products"
      ON products FOR UPDATE
      USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete products'
  ) THEN
    CREATE POLICY "Admins can delete products"
      ON products FOR DELETE
      USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
      );
  END IF;
END $$;

-- ============================================================
-- 4. Storage bucket for product images
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public read product images'
  ) THEN
    CREATE POLICY "Public read product images"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'product-images');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins upload product images'
  ) THEN
    CREATE POLICY "Admins upload product images"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'product-images' AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins delete product images'
  ) THEN
    CREATE POLICY "Admins delete product images"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'product-images' AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
      );
  END IF;
END $$;

-- ============================================================
-- Done! Admin credentials:
--   Email:    admin@electricworld.com
--   Password: 123
-- ============================================================
