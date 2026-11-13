-- ==============================================================================
-- DreamQueen Atelier — Idempotent Production Database Hardening Migration
-- Safe to re-run multiple times in Supabase SQL Editor.
-- Preserves all existing tables and data while adding production tables,
-- missing columns, triggers, storage buckets, and hardened RLS policies.
-- ==============================================================================

-- 1. PROFILES & ROLE PROTECTION
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  email text,
  phone text,
  role text DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  saved_addresses jsonb DEFAULT '[]'::jsonb,
  wishlist_product_ids text[] DEFAULT '{}'::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wishlist_product_ids text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS saved_addresses jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper function: checks trusted admin role without recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Prevent non-admin users from self-promoting to admin
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS DISTINCT FROM 'customer' AND NOT public.is_admin() THEN
      NEW.role := 'customer';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
      NEW.role := OLD.role;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- Auto-create profile on Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'phone', new.phone, ''),
    'customer'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = CASE WHEN excluded.full_name <> '' THEN excluded.full_name ELSE public.profiles.full_name END,
    email = CASE WHEN excluded.email <> '' THEN excluded.email ELSE public.profiles.email END,
    phone = CASE WHEN excluded.phone <> '' THEN excluded.phone ELSE public.profiles.phone END,
    updated_at = now();
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. SAVED CUSTOMER ADDRESSES
CREATE TABLE IF NOT EXISTS public.addresses (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label text DEFAULT 'Home',
  full_name text NOT NULL,
  phone text NOT NULL,
  email text DEFAULT '',
  address_line1 text NOT NULL,
  address_line2 text DEFAULT '',
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own addresses" ON public.addresses;
CREATE POLICY "Users manage own addresses"
  ON public.addresses FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 3. PRODUCTS TABLE HARDENING
CREATE TABLE IF NOT EXISTS public.products (
  id text PRIMARY KEY,
  name text NOT NULL,
  tagline text DEFAULT '',
  price numeric NOT NULL CHECK (price >= 0),
  original_price numeric,
  rating numeric DEFAULT 5.0,
  reviews_count integer DEFAULT 0,
  category text NOT NULL,
  images text[] DEFAULT '{}'::text[],
  stock integer DEFAULT 10 CHECK (stock >= 0),
  colors jsonb DEFAULT '[]'::jsonb,
  description text DEFAULT '',
  yarn_type text DEFAULT '100% Milk Cotton Yarn',
  care_instructions text DEFAULT '',
  tags text[] DEFAULT '{}'::text[],
  is_best_seller boolean DEFAULT false,
  is_new_arrival boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read-write products" ON public.products;
DROP POLICY IF EXISTS "Public can read active products" ON public.products;
CREATE POLICY "Public can read active products"
  ON public.products FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage products" ON public.products;
CREATE POLICY "Admins manage products"
  ON public.products FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. ORDERS, ORDER_ITEMS & PAYMENTS TABLES
CREATE TABLE IF NOT EXISTS public.orders (
  id text PRIMARY KEY,
  order_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer jsonb NOT NULL,
  shipping_address jsonb NOT NULL,
  items jsonb NOT NULL,
  subtotal numeric NOT NULL CHECK (subtotal >= 0),
  discount numeric DEFAULT 0 CHECK (discount >= 0),
  coupon_code text,
  shipping_fee numeric DEFAULT 0 CHECK (shipping_fee >= 0),
  cod_fee numeric DEFAULT 0 CHECK (cod_fee >= 0),
  total numeric NOT NULL CHECK (total >= 0),
  payment_method text NOT NULL CHECK (payment_method IN ('razorpay', 'upi_qr', 'cod')),
  payment_status text NOT NULL CHECK (payment_status IN ('paid', 'pending', 'failed', 'refund_initiated', 'refunded')),
  razorpay_payment_id text,
  razorpay_order_id text,
  upi_transaction_ref text,
  payment_verified_at timestamptz,
  tracking_status text DEFAULT 'pending',
  shiprocket_tracking_number text,
  estimated_delivery_date text,
  notes text,
  cancellation_reason text,
  refund_status text,
  refund_id text,
  status_history jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS upi_transaction_ref text,
  ADD COLUMN IF NOT EXISTS payment_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS refund_status text,
  ADD COLUMN IF NOT EXISTS refund_id text,
  ADD COLUMN IF NOT EXISTS status_history jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Remove unsafe open public read-write policy
DROP POLICY IF EXISTS "Allow public read-write orders" ON public.orders;

-- Customers can read their own orders; Admins can read all orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR user_id = auth.uid()
    OR lower(coalesce(customer ->> 'email', '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- Authenticated users can insert orders linked to their own account; admins can update/delete
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR user_id = auth.uid()
    OR lower(coalesce(customer ->> 'email', '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

DROP POLICY IF EXISTS "Users can cancel own pending orders or admins update" ON public.orders;
CREATE POLICY "Users can cancel own pending orders or admins update"
  ON public.orders FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR (
      (user_id = auth.uid() OR lower(coalesce(customer ->> 'email', '')) = lower(coalesce(auth.jwt() ->> 'email', '')))
      AND tracking_status IN ('pending', 'payment_pending', 'preparing')
    )
  )
  WITH CHECK (
    public.is_admin()
    OR tracking_status = 'cancelled'
  );

DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders"
  ON public.orders FOR DELETE TO authenticated
  USING (public.is_admin());

-- Normalized Order Items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id text PRIMARY KEY,
  order_id text REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id text NOT NULL,
  product_name text NOT NULL,
  image text DEFAULT '',
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  selected_color jsonb DEFAULT '{"name":"Original","hex":"#5B3A29"}'::jsonb,
  line_total numeric NOT NULL CHECK (line_total >= 0),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order items follow parent order visibility" ON public.order_items;
CREATE POLICY "Order items follow parent order visibility"
  ON public.order_items FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.user_id = auth.uid() OR lower(coalesce(o.customer ->> 'email', '')) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

DROP POLICY IF EXISTS "Order items insert for own order" ON public.order_items;
CREATE POLICY "Order items insert for own order"
  ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.user_id = auth.uid() OR lower(coalesce(o.customer ->> 'email', '')) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

-- Payments ledger table
CREATE TABLE IF NOT EXISTS public.payments (
  id text PRIMARY KEY,
  order_id text REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  order_number text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  gateway text NOT NULL CHECK (gateway IN ('razorpay', 'upi_qr', 'cod')),
  amount numeric NOT NULL CHECK (amount >= 0),
  currency text DEFAULT 'INR',
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refund_initiated', 'refunded')),
  gateway_order_id text,
  gateway_payment_id text,
  gateway_signature text,
  upi_transaction_ref text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_order_id ON public.payments(gateway_order_id);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT TO authenticated
  USING (public.is_admin() OR user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage payments" ON public.payments;
CREATE POLICY "Admins manage payments"
  ON public.payments FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
  code text PRIMARY KEY,
  discount_percent numeric DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  min_order_amount numeric DEFAULT 0 CHECK (min_order_amount >= 0),
  max_discount numeric,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  max_uses integer,
  used_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS max_uses integer,
  ADD COLUMN IF NOT EXISTS used_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read active coupons" ON public.coupons;
CREATE POLICY "Public can read active coupons"
  ON public.coupons FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage coupons" ON public.coupons;
CREATE POLICY "Admins manage coupons"
  ON public.coupons FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed default coupons safely without overwriting admin edits
INSERT INTO public.coupons (code, discount_percent, min_order_amount, max_discount, description, is_active)
VALUES
  ('DREAM10', 10, 99, 100, '10% off your entire handmade crochet cart', true),
  ('FREESHIP', 0, 499, null, 'Free standard 7-day express shipping on orders over ₹499', true),
  ('QUEEN20', 20, 399, 200, 'Special 20% off festive bundle discount', true)
ON CONFLICT (code) DO NOTHING;

-- 6. CUSTOM ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.custom_orders (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  email text DEFAULT '',
  phone text NOT NULL,
  category text DEFAULT '',
  color_preference text DEFAULT '',
  size text DEFAULT '',
  budget text DEFAULT '',
  delivery_date_preference text DEFAULT '',
  reference_image_url text,
  message text NOT NULL,
  status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'accepted', 'in_progress', 'completed', 'rejected')),
  quoted_price numeric,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.custom_orders
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quoted_price numeric,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read-write custom_orders" ON public.custom_orders;

DROP POLICY IF EXISTS "Users read own custom orders" ON public.custom_orders;
CREATE POLICY "Users read own custom orders"
  ON public.custom_orders FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR user_id = auth.uid()
    OR lower(coalesce(email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

DROP POLICY IF EXISTS "Authenticated users create custom orders" ON public.custom_orders;
CREATE POLICY "Authenticated users create custom orders"
  ON public.custom_orders FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Admins update custom orders" ON public.custom_orders;
CREATE POLICY "Admins update custom orders"
  ON public.custom_orders FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. PRODUCT REVIEWS / FEEDBACKS TABLE
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id text NOT NULL,
  order_number text NOT NULL,
  product_id text NOT NULL,
  product_name text NOT NULL,
  product_image text DEFAULT '',
  selected_color jsonb DEFAULT '{}'::jsonb,
  customer_name text NOT NULL,
  customer_email text DEFAULT '',
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  headline text DEFAULT '',
  comment text NOT NULL,
  tags text[] DEFAULT '{}'::text[],
  photo_url text,
  recommend boolean DEFAULT true,
  is_verified_purchase boolean DEFAULT true,
  is_approved boolean DEFAULT true,
  artisan_response jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.feedbacks
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_verified_purchase boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT true;

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read-write feedbacks" ON public.feedbacks;

DROP POLICY IF EXISTS "Public reads approved reviews" ON public.feedbacks;
CREATE POLICY "Public reads approved reviews"
  ON public.feedbacks FOR SELECT TO anon, authenticated
  USING (is_approved = true OR public.is_admin() OR user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users create reviews" ON public.feedbacks;
CREATE POLICY "Authenticated users create reviews"
  ON public.feedbacks FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR user_id = auth.uid() OR lower(coalesce(customer_email, '')) = lower(coalesce(auth.jwt() ->> 'email', '')));

DROP POLICY IF EXISTS "Review owners and admins update reviews" ON public.feedbacks;
CREATE POLICY "Review owners and admins update reviews"
  ON public.feedbacks FOR UPDATE TO authenticated
  USING (public.is_admin() OR user_id = auth.uid() OR lower(coalesce(customer_email, '')) = lower(coalesce(auth.jwt() ->> 'email', '')))
  WITH CHECK (public.is_admin() OR user_id = auth.uid() OR lower(coalesce(customer_email, '')) = lower(coalesce(auth.jwt() ->> 'email', '')));

DROP POLICY IF EXISTS "Admins delete reviews" ON public.feedbacks;
CREATE POLICY "Admins delete reviews"
  ON public.feedbacks FOR DELETE TO authenticated
  USING (public.is_admin());

-- 8. NEWSLETTER SUBSCRIBERS TABLE
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id text PRIMARY KEY,
  email text UNIQUE NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  source text DEFAULT 'website',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Public can subscribe to newsletter"
  ON public.newsletter_subscribers FOR INSERT TO anon, authenticated
  WITH CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$');

DROP POLICY IF EXISTS "Admins manage newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins manage newsletter subscribers"
  ON public.newsletter_subscribers FOR SELECT TO authenticated
  USING (public.is_admin());

-- 9. STORE SETTINGS TABLE (NO PRIVATE API SECRETS STORED HERE)
CREATE TABLE IF NOT EXISTS public.store_settings (
  id integer PRIMARY KEY CHECK (id = 1),
  cod_enabled boolean DEFAULT true,
  cod_fee numeric DEFAULT 10,
  free_shipping_threshold numeric DEFAULT 499,
  standard_shipping_fee numeric DEFAULT 20,
  support_phone text DEFAULT '8097706536',
  support_email text DEFAULT 'ayeshalk2025@gmail.com',
  pinterest_url text DEFAULT 'https://in.pinterest.com/ayeshalk2025/?actingBusinessId=1147221842487308120',
  pinterest_handle text DEFAULT 'ayeshalk2025',
  upi_id text DEFAULT '8097706536@postbank',
  upi_payee_name text DEFAULT 'AYESHA LUKMAN SHAIKH',
  studio_address text DEFAULT 'Room No. 30, Building No. 47, Anarya Co. Op. Housing Society, Mahim (East)',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS studio_address text DEFAULT 'Room No. 30, Building No. 47, Anarya Co. Op. Housing Society, Mahim (East)';

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads store settings" ON public.store_settings;
CREATE POLICY "Public reads store settings"
  ON public.store_settings FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins update store settings" ON public.store_settings;
CREATE POLICY "Admins update store settings"
  ON public.store_settings FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO public.store_settings (
  id, cod_enabled, cod_fee, free_shipping_threshold, standard_shipping_fee,
  support_phone, support_email, pinterest_url, pinterest_handle, upi_id, upi_payee_name, studio_address
) VALUES (
  1, true, 10, 499, 20,
  '8097706536', 'ayeshalk2025@gmail.com',
  'https://in.pinterest.com/ayeshalk2025/?actingBusinessId=1147221842487308120',
  'ayeshalk2025', '8097706536@postbank', 'AYESHA LUKMAN SHAIKH',
  'Room No. 30, Building No. 47, Anarya Co. Op. Housing Society, Mahim (East)'
)
ON CONFLICT (id) DO NOTHING;

-- 10. SECURE ORDER TRACKING RPC (No global PII leak to unauthenticated users)
CREATE OR REPLACE FUNCTION public.track_order_secure(p_order_number text, p_contact text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders;
  v_clean_contact text;
  v_digits text;
  v_order_phone text;
  v_order_email text;
BEGIN
  v_clean_contact := lower(trim(coalesce(p_contact, '')));
  v_digits := regexp_replace(v_clean_contact, '[^0-9]', '', 'g');

  SELECT * INTO v_order
  FROM public.orders
  WHERE upper(order_number) = upper(trim(coalesce(p_order_number, '')))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_order_email := lower(trim(coalesce(v_order.customer ->> 'email', v_order.shipping_address ->> 'email', '')));
  v_order_phone := regexp_replace(coalesce(v_order.customer ->> 'phone', v_order.shipping_address ->> 'phone', ''), '[^0-9]', '', 'g');

  IF NOT (
    public.is_admin()
    OR (auth.uid() IS NOT NULL AND v_order.user_id = auth.uid())
    OR (v_clean_contact <> '' AND v_order_email = v_clean_contact)
    OR (length(v_digits) >= 10 AND right(v_order_phone, 10) = right(v_digits, 10))
  ) THEN
    RETURN NULL;
  END IF;

  RETURN to_jsonb(v_order);
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_order_secure(text, text) TO anon, authenticated;

-- 11. SUPABASE STORAGE BUCKETS & POLICIES
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('custom-order-references', 'custom-order-references', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('product-images', 'custom-order-references'));

DROP POLICY IF EXISTS "Admin upload product images" ON storage.objects;
CREATE POLICY "Admin upload product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin delete product images" ON storage.objects;
CREATE POLICY "Admin delete product images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Authenticated upload custom references" ON storage.objects;
CREATE POLICY "Authenticated upload custom references"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'custom-order-references');

-- 12. REALTIME PUBLICATIONS
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.products; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.orders; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_orders; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.feedbacks; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==============================================================================
-- NOTE: To promote your DreamQueen owner account to Admin securely, run in SQL Editor:
-- UPDATE public.profiles SET role = 'admin' WHERE lower(email) = 'ayeshalk2025@gmail.com';
-- ==============================================================================
