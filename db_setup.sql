-- To'lov so'rovlari jadvali
CREATE TABLE payment_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  user_email text NOT NULL,
  plan_type text NOT NULL, -- 'monthly' yoki 'yearly'
  receipt_url text NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Promokodlar jadvali
CREATE TABLE promo_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  plan_type text NOT NULL, -- 'monthly' yoki 'yearly'
  is_used boolean DEFAULT false,
  used_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Barcha foydalanuvchilar o'qiydi, admin yozadi
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own requests" ON payment_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own requests" ON payment_requests FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM auth.users WHERE email IN ('admin@samizar.uz', 'bmcqr@admin.com')));
CREATE POLICY "Admins can update requests" ON payment_requests FOR UPDATE USING (auth.uid() IN (SELECT id FROM auth.users WHERE email IN ('admin@samizar.uz', 'bmcqr@admin.com')));

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view promo codes" ON promo_codes FOR SELECT USING (true);
CREATE POLICY "Admins can manage promo codes" ON promo_codes FOR ALL USING (auth.uid() IN (SELECT id FROM auth.users WHERE email IN ('admin@samizar.uz', 'bmcqr@admin.com')));
CREATE POLICY "Users can update promo codes to mark used" ON promo_codes FOR UPDATE USING (true);
