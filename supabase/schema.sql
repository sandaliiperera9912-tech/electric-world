-- ============================================================
-- Electric World — Supabase Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- ============================================================

-- ============================================================
-- 1. PROFILES
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  full_name   text default '',
  avatar_url  text,
  created_at  timestamptz default now()
);

-- ============================================================
-- 2. CATEGORIES
-- ============================================================
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  icon        text not null default 'Package',
  created_at  timestamptz default now()
);

-- ============================================================
-- 3. PRODUCTS
-- ============================================================
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text not null default '',
  price        numeric(10,2) not null check (price >= 0),
  category     text not null,
  images       text[] default '{}',
  stock        integer not null default 0 check (stock >= 0),
  rating       numeric(3,2) default 0.0 check (rating >= 0 and rating <= 5),
  review_count integer default 0,
  badge        text,
  created_at   timestamptz default now()
);

-- ============================================================
-- 4. CARTS & CART ITEMS
-- ============================================================
create table if not exists public.carts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(user_id)
);

create table if not exists public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  cart_id     uuid not null references public.carts(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  quantity    integer not null default 1 check (quantity > 0),
  unique(cart_id, product_id)
);

-- ============================================================
-- 5. WISHLISTS
-- ============================================================
create table if not exists public.wishlists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(user_id, product_id)
);

-- ============================================================
-- 6. ORDERS & ORDER ITEMS
-- ============================================================
create table if not exists public.orders (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references auth.users(id) on delete cascade,
  status                    text not null default 'pending'
                              check (status in ('pending','processing','shipped','delivered','cancelled')),
  total                     numeric(10,2) not null,
  stripe_payment_intent_id  text,
  shipping_name             text,
  shipping_address_line1    text,
  shipping_address_line2    text,
  shipping_city             text,
  shipping_postcode         text,
  shipping_country          text,
  created_at                timestamptz default now()
);

create table if not exists public.order_items (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.orders(id) on delete cascade,
  product_id          uuid not null references public.products(id),
  quantity            integer not null check (quantity > 0),
  price_at_purchase   numeric(10,2) not null
);

-- ============================================================
-- 7. REVIEWS
-- ============================================================
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz default now(),
  unique(product_id, user_id)
);

-- ============================================================
-- 8. SUPPORT LOGS
-- ============================================================
create table if not exists public.support_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id),
  message     text not null,
  resolved    boolean default false,
  created_at  timestamptz default now()
);

-- ============================================================
-- 9. AI LOGS
-- ============================================================
create table if not exists public.ai_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id),
  tool_name   text,
  success     boolean default true,
  latency_ms  integer,
  created_at  timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles    enable row level security;
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.carts       enable row level security;
alter table public.cart_items  enable row level security;
alter table public.wishlists   enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews     enable row level security;
alter table public.support_logs enable row level security;
alter table public.ai_logs     enable row level security;

-- Public read: categories & products
create policy "Public read categories" on public.categories for select using (true);
create policy "Public read products"   on public.products   for select using (true);
create policy "Public read reviews"    on public.reviews    for select using (true);

-- Profiles: users manage their own
create policy "Users read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Carts: users manage their own
create policy "Users read own cart"   on public.carts for select using (auth.uid() = user_id);
create policy "Users insert own cart" on public.carts for insert with check (auth.uid() = user_id);
create policy "Users delete own cart" on public.carts for delete using (auth.uid() = user_id);

-- Cart items: users access via their cart
create policy "Users read own cart items"   on public.cart_items for select
  using (cart_id in (select id from public.carts where user_id = auth.uid()));
create policy "Users insert own cart items" on public.cart_items for insert
  with check (cart_id in (select id from public.carts where user_id = auth.uid()));
create policy "Users update own cart items" on public.cart_items for update
  using (cart_id in (select id from public.carts where user_id = auth.uid()));
create policy "Users delete own cart items" on public.cart_items for delete
  using (cart_id in (select id from public.carts where user_id = auth.uid()));

-- Wishlists: users manage their own
create policy "Users read own wishlist"   on public.wishlists for select using (auth.uid() = user_id);
create policy "Users insert own wishlist" on public.wishlists for insert with check (auth.uid() = user_id);
create policy "Users delete own wishlist" on public.wishlists for delete using (auth.uid() = user_id);

-- Orders: users manage their own
create policy "Users read own orders"   on public.orders for select using (auth.uid() = user_id);
create policy "Users insert own orders" on public.orders for insert with check (auth.uid() = user_id);

-- Order items: users access via their orders
create policy "Users read own order items" on public.order_items for select
  using (order_id in (select id from public.orders where user_id = auth.uid()));
create policy "Users insert own order items" on public.order_items for insert
  with check (order_id in (select id from public.orders where user_id = auth.uid()));

-- Reviews: users manage their own
create policy "Users insert own reviews" on public.reviews for insert with check (auth.uid() = user_id);
create policy "Users update own reviews" on public.reviews for update using (auth.uid() = user_id);
create policy "Users delete own reviews" on public.reviews for delete using (auth.uid() = user_id);

-- Support & AI logs: insert for all, read own
create policy "Users insert support logs" on public.support_logs for insert with check (true);
create policy "Users insert ai logs"      on public.ai_logs      for insert with check (true);


-- ============================================================
-- SEED DATA — Categories
-- ============================================================
insert into public.categories (name, slug, icon) values
  ('Phones',          'phones',     'Smartphone'),
  ('Laptops',         'laptops',    'Laptop'),
  ('Audio',           'audio',      'Headphones'),
  ('TVs',             'tvs',        'Tv'),
  ('Monitors',        'monitors',   'Monitor'),
  ('Cameras',         'cameras',    'Camera'),
  ('Home Appliances', 'appliances', 'Home')
on conflict (slug) do nothing;


-- ============================================================
-- SEED DATA — Products (20+ realistic electronics)
-- ============================================================
insert into public.products (name, description, price, category, images, stock, rating, review_count, badge) values

-- AUDIO
('Sony WH-1000XM5',
 'Industry-leading noise cancellation with 30hr battery, crystal-clear call quality, and premium Hi-Res Audio. Multipoint connection for 2 devices simultaneously.',
 349.00, 'audio', '{}', 24, 4.9, 2847, 'Best Seller'),

('Bose QuietComfort Ultra',
 'Immersive spatial audio with world-class noise cancelling and 24-hour battery life. The most comfortable over-ear headphones Bose has ever made.',
 329.00, 'audio', '{}', 18, 4.8, 1673, NULL),

('Apple AirPods Pro 2',
 'Active noise cancellation up to 2× more powerful. Adaptive Audio, Personalized Spatial Audio, and up to 30 hours total battery with case.',
 249.00, 'audio', '{}', 35, 4.7, 4102, NULL),

('Bose SoundLink Max',
 'Our biggest, boldest portable speaker. 20-hour battery, IP67 waterproof, lossless audio over USB-C. Built for outdoor adventures.',
 399.00, 'audio', '{}', 14, 4.7, 891, 'New'),

('Samsung Galaxy Buds3 Pro',
 'Intelligent Active Noise Cancellation, 360 Audio with head tracking, and 6-hour playtime. Wing-tip design stays secure all day.',
 229.00, 'audio', '{}', 20, 4.6, 743, NULL),

-- PHONES
('iPhone 15 Pro Max',
 'Titanium design with A17 Pro chip, 48MP main camera with 5× optical zoom, USB-C with USB 3 speeds, and Action Button. The ultimate iPhone.',
 1199.00, 'phones', '{}', 12, 4.8, 5621, 'New'),

('Samsung Galaxy S24 Ultra',
 'Built-in S Pen, 200MP camera, titanium frame, Snapdragon 8 Gen 3, and a massive 5,000mAh battery. The most capable Android phone ever.',
 1299.00, 'phones', '{}', 9, 4.7, 3894, NULL),

('Google Pixel 8 Pro',
 'The best camera on any phone, powered by Google Tensor G3 AI. 7 years of OS updates, Temperature sensor, and the brightest Pixel display.',
 999.00, 'phones', '{}', 15, 4.7, 2156, NULL),

('OnePlus 12',
 'Snapdragon 8 Gen 3, Hasselblad camera system, 100W SUPERVOOC charging, 5,400mAh battery. From zero to 100% in 26 minutes.',
 799.00, 'phones', '{}', 22, 4.6, 1247, 'Deal'),

-- LAPTOPS
('MacBook Air 15" M3',
 '18-hour battery, fanless design, blazing-fast M3 chip, 15.3" Liquid Retina display. The world''s best thin-and-light laptop just got bigger.',
 1299.00, 'laptops', '{}', 8, 4.9, 3104, 'Top Rated'),

('MacBook Air 13" M3',
 'All the power of M3 in the iconic ultra-thin design. 18-hour battery, up to 24GB unified memory, 2 Thunderbolt 4 ports.',
 1099.00, 'laptops', '{}', 11, 4.9, 2891, NULL),

('Dell XPS 15',
 '15.6" OLED display, 13th Gen Intel Core i9, NVIDIA RTX 4060, 32GB RAM. A powerhouse laptop for creative professionals.',
 1899.00, 'laptops', '{}', 5, 4.7, 1532, NULL),

('ASUS ROG Zephyrus G14',
 'AMD Ryzen 9 8945HS, NVIDIA RTX 4060, 14" OLED QHD+ 165Hz display. The most powerful compact gaming laptop ever built.',
 1499.00, 'laptops', '{}', 7, 4.8, 1087, 'Deal'),

-- TVs
('Samsung 65" QLED 4K QN90C',
 'Quantum HDR 32x, Neo QLED technology, 144Hz refresh rate, Dolby Atmos sound, and Samsung Gaming Hub for console-free gaming.',
 1799.00, 'tvs', '{}', 5, 4.7, 1239, NULL),

('LG C3 OLED 55"',
 'Perfect blacks, infinite contrast, and Dolby Vision IQ. 4K OLED evo panel, 120Hz for gaming, webOS with Google Assistant and Alexa.',
 1499.00, 'tvs', '{}', 6, 4.9, 2034, 'Top Rated'),

('Sony Bravia XR 75" X95L',
 'Full Array LED with Cognitive Processor XR, XR Triluminos Pro, IMAX Enhanced, and 4K 120Hz for PlayStation 5 and Xbox Series X.',
 2299.00, 'tvs', '{}', 3, 4.8, 876, NULL),

-- MONITORS
('LG UltraGear 27GN950-B',
 '27" 4K Nano IPS, 144Hz, 1ms response, HDMI 2.1, G-Sync Compatible, DisplayHDR 600. The benchmark for premium gaming monitors.',
 599.00, 'monitors', '{}', 12, 4.8, 1542, NULL),

('Samsung Odyssey G9 49"',
 '49" Super Ultrawide DQHD 5120×1440, 240Hz, 1ms, 1000R curvature, Quantum Mini-LED. The most immersive gaming monitor available.',
 1299.00, 'monitors', '{}', 4, 4.6, 743, 'Deal'),

-- CAMERAS
('DJI Mini 4 Pro',
 '4K/60fps Omnidirectional Obstacle Sensing drone, 34-min max flight time, 20km video transmission, under 249g. No registration needed.',
 759.00, 'cameras', '{}', 15, 4.8, 876, 'New'),

('Sony A7 IV Full-Frame Mirrorless',
 '33MP full-frame BSI sensor, 4K 60fps video, 10fps burst, 5-axis IBIS, dual card slots. The benchmark of hybrid creators.',
 2499.00, 'cameras', '{}', 4, 4.9, 1203, NULL),

-- APPLIANCES
('Dyson V15 Detect',
 'Laser dust detection reveals hidden dust. Fluffy Optic cleaner head, 60 min run time, LCD screen showing particle count in real time.',
 749.00, 'appliances', '{}', 10, 4.8, 2103, 'Top Rated'),

('iRobot Roomba j7+',
 'AI-powered obstacle avoidance avoids pet waste and cords. Automatically empties itself for 60 days. Smart mapping learns your home.',
 599.00, 'appliances', '{}', 8, 4.6, 1456, NULL),

('Ninja Foodi 9-in-1 Deluxe XL',
 'Pressure cooker AND air fryer in one. 8-quart capacity feeds up to 8. TenderCrisp technology for crispy AND juicy results every time.',
 199.00, 'appliances', '{}', 25, 4.7, 3287, 'Deal')

on conflict do nothing;
