/*
  # Complete Netomari Database Schema
  
  Total Tables: 32
  
  1. Users & Auth
     - users
  2. Master Data
     - categories
     - system_settings
  3. Catalog
     - vehicles
     - rental_vehicles
     - equipment
     - partners
     - activities
  4. Transactions
     - reservations
     - reservation_equipment
     - reservation_activities
  5. Community - Stories
     - stories
     - story_questions
     - story_answers
     - story_likes
     - story_favorites
  6. Community - Q&A
     - questions
     - answers
  7. Community - Reviews
     - reviews
     - review_helpfuls
  8. Community - Events
     - events
     - event_participants
  9. User Data
     - vehicle_favorites
     - partner_favorites
     - notifications
     - routes
     - route_stops
  10. Operations
     - rental_checklists
     - equipment_preparations
     - contacts
     - admin_logs
     - announcements

  Updated: 2026-02-11
  Changes:
    - rental_vehicles に license_plate カラム追加
    - system_settings に payment_method カラム追加
    - 全テーブルに updated_at トリガー追加
    - 初期データ（system_settings）の INSERT 追加
*/

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check user roles
CREATE OR REPLACE FUNCTION check_user_role(allowed_roles text[])
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = auth.uid();
  
  RETURN user_role = ANY(allowed_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. USERS & AUTH
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  phone_number text,
  date_of_birth date,
  postal_code text,
  prefecture text,
  city text,
  address_line text,
  building text,
  role text NOT NULL DEFAULT 'Members' CHECK (role IN ('Admin', 'Staff', 'Partners', 'Members')),
  rank text NOT NULL DEFAULT 'Bronze' CHECK (rank IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
  email_notifications boolean DEFAULT true,
  story_notifications boolean DEFAULT true,
  rental_notifications boolean DEFAULT true,
  comment_notifications boolean DEFAULT true,
  profile_visibility text DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private')),
  show_email boolean DEFAULT false,
  show_phone boolean DEFAULT false,
  account_status text DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deactivated')),
  suspended_at timestamptz,
  suspended_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON users FOR SELECT TO authenticated USING (check_user_role(ARRAY['Admin']));
CREATE POLICY "Admins can update all users" ON users FOR UPDATE TO authenticated USING (check_user_role(ARRAY['Admin']));

-- Handle new user creation from Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    phone_number,
    postal_code,
    prefecture,
    city,
    address_line,
    building,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'postal_code',
    NEW.raw_user_meta_data->>'prefecture',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'address_line',
    NEW.raw_user_meta_data->>'building',
    'Members'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 2. MASTER DATA
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('equipment', 'partner', 'contact', 'vehicle')),
  key text NOT NULL,
  label_ja text NOT NULL,
  label_en text,
  description text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(type, key)
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view active categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (check_user_role(ARRAY['Admin']));

CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  description text,
  payment_method text DEFAULT 'both' CHECK (payment_method IN ('card_only', 'onsite_only', 'both')),
  rank_settings jsonb DEFAULT '{
    "ranks": {
      "Bronze": {"name": "Bronze", "min_amount": 0, "min_likes": 0, "min_posts": 0, "discount_rate": 0},
      "Silver": {"name": "Silver", "min_amount": 50000, "min_likes": 10, "min_posts": 3, "discount_rate": 5},
      "Gold": {"name": "Gold", "min_amount": 200000, "min_likes": 30, "min_posts": 10, "discount_rate": 10},
      "Platinum": {"name": "Platinum", "min_amount": 500000, "min_likes": 100, "min_posts": 30, "discount_rate": 15}
    }
  }'::jsonb,
  updated_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view settings" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update settings" ON system_settings FOR UPDATE USING (check_user_role(ARRAY['Admin']));
CREATE POLICY "Admins can insert settings" ON system_settings FOR INSERT WITH CHECK (check_user_role(ARRAY['Admin']));

-- ============================================================================
-- 3. CATALOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text,
  manufacturer text,
  year integer,
  price numeric,
  description text,
  specs jsonb DEFAULT '{}'::jsonb,
  features jsonb DEFAULT '{}'::jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'Available',
  purpose text NOT NULL DEFAULT 'sale' CHECK (purpose IN ('sale', 'rental', 'both')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view vehicles" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Staff can manage vehicles" ON vehicles FOR ALL USING (check_user_role(ARRAY['Admin', 'Staff']));

CREATE TABLE IF NOT EXISTS rental_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  location text,
  license_plate text,
  price_per_day numeric NOT NULL,
  available_dates jsonb DEFAULT '[]'::jsonb,
  unavailable_dates jsonb DEFAULT '[]'::jsonb,
  maintenance_dates jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'Available' CHECK (status IN ('Available', 'OnRent', 'Returned', 'Maintenance')),
  options jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rental_vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view rental vehicles" ON rental_vehicles FOR SELECT USING (true);
CREATE POLICY "Staff can manage rental vehicles" ON rental_vehicles FOR ALL USING (check_user_role(ARRAY['Admin', 'Staff']));

CREATE TABLE IF NOT EXISTS equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  price_per_day numeric NOT NULL,
  quantity integer DEFAULT 0,
  available_quantity integer DEFAULT 0,
  images jsonb DEFAULT '[]'::jsonb,
  specs jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'Available',
  pricing_type text DEFAULT 'PerDay' CHECK (pricing_type IN ('PerDay', 'PerUnit')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view equipment" ON equipment FOR SELECT USING (true);
CREATE POLICY "Staff can manage equipment" ON equipment FOR ALL USING (check_user_role(ARRAY['Admin', 'Staff']));

CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  description text,
  address text,
  latitude numeric,
  longitude numeric,
  contact jsonb DEFAULT '{}'::jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  facilities jsonb DEFAULT '{}'::jsonb,
  pricing jsonb DEFAULT '{}'::jsonb,
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  opening_hours jsonb DEFAULT '{}'::jsonb,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view partners" ON partners FOR SELECT USING (true);
CREATE POLICY "Admins can manage partners" ON partners FOR ALL USING (check_user_role(ARRAY['Admin']));
CREATE POLICY "Partners can manage own data" ON partners FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric,
  price_type text,
  duration text,
  duration_minutes integer,
  location text,
  provider text,
  partner_id uuid REFERENCES partners(id) ON DELETE SET NULL,
  start_date date,
  end_date date,
  min_participants integer,
  max_participants integer,
  difficulty_level text DEFAULT 'Beginner',
  available_seasons jsonb DEFAULT '[]'::jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  tags jsonb DEFAULT '[]'::jsonb,
  included jsonb DEFAULT '[]'::jsonb,
  requirements jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'Active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view activities" ON activities FOR SELECT USING (true);
CREATE POLICY "Staff can manage activities" ON activities FOR ALL USING (check_user_role(ARRAY['Admin', 'Staff']));

-- ============================================================================
-- 4. TRANSACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  rental_vehicle_id uuid REFERENCES rental_vehicles(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  days integer NOT NULL,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'InProgress', 'Cancelled', 'Completed')),
  subtotal numeric NOT NULL,
  tax numeric NOT NULL,
  total numeric NOT NULL,
  options jsonb DEFAULT '{}'::jsonb,
  payment_method text,
  payment_status text DEFAULT 'Pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reservations" ON reservations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all reservations" ON reservations FOR SELECT USING (check_user_role(ARRAY['Admin', 'Staff']));
CREATE POLICY "Users can create reservations" ON reservations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff can update reservations" ON reservations FOR UPDATE USING (check_user_role(ARRAY['Admin', 'Staff']));
CREATE POLICY "Users can update own reservations" ON reservations FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS reservation_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id) ON DELETE CASCADE,
  equipment_id uuid REFERENCES equipment(id),
  quantity integer NOT NULL DEFAULT 1,
  days integer NOT NULL,
  price_per_day numeric NOT NULL,
  subtotal numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reservation_equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own equipments" ON reservation_equipment FOR SELECT USING (EXISTS (SELECT 1 FROM reservations WHERE id = reservation_equipment.reservation_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert own equipments" ON reservation_equipment FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM reservations WHERE id = reservation_equipment.reservation_id AND user_id = auth.uid()));
CREATE POLICY "Staff can manage reservation equipment" ON reservation_equipment FOR ALL USING (check_user_role(ARRAY['Admin', 'Staff']));

CREATE TABLE IF NOT EXISTS reservation_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES activities(id),
  date date NOT NULL,
  participants integer NOT NULL DEFAULT 1,
  price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reservation_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activities" ON reservation_activities FOR SELECT USING (EXISTS (SELECT 1 FROM reservations WHERE id = reservation_activities.reservation_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert own activities" ON reservation_activities FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM reservations WHERE id = reservation_activities.reservation_id AND user_id = auth.uid()));
CREATE POLICY "Staff can manage reservation activities" ON reservation_activities FOR ALL USING (check_user_role(ARRAY['Admin', 'Staff']));

-- ============================================================================
-- 5. COMMUNITY - STORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  cover_image text,
  images jsonb DEFAULT '[]'::jsonb,
  location text,
  latitude numeric,
  longitude numeric,
  tags jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published', 'Archived')),
  likes integer DEFAULT 0,
  views integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published stories" ON stories FOR SELECT USING (status = 'Published' OR auth.uid() = author_id);
CREATE POLICY "Users can manage own stories" ON stories FOR ALL USING (auth.uid() = author_id);
CREATE POLICY "Staff can manage all stories" ON stories FOR ALL USING (check_user_role(ARRAY['Admin', 'Staff']));

CREATE TABLE IF NOT EXISTS story_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE story_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view questions" ON story_questions FOR SELECT USING (true);
CREATE POLICY "Users can create questions" ON story_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own story questions" ON story_questions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own story questions" ON story_questions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS story_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES story_questions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE story_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view answers" ON story_answers FOR SELECT USING (true);
CREATE POLICY "Users can create answers" ON story_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own story answers" ON story_answers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own story answers" ON story_answers FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS story_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(story_id, user_id)
);

ALTER TABLE story_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view likes" ON story_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage likes" ON story_likes FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS story_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(story_id, user_id)
);

ALTER TABLE story_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own favorites" ON story_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own favorites" ON story_favorites FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 6. COMMUNITY - Q&A
-- ============================================================================

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status text DEFAULT 'Open',
  views integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Users can create questions" ON questions FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own questions" ON questions FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own questions" ON questions FOR DELETE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Staff can manage all questions" ON questions FOR ALL USING (check_user_role(ARRAY['Admin', 'Staff']));

CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  is_accepted boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view answers" ON answers FOR SELECT USING (true);
CREATE POLICY "Users can create answers" ON answers FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own answers" ON answers FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own answers" ON answers FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- ============================================================================
-- 7. COMMUNITY - REVIEWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('Vehicle', 'RentalVehicle', 'Partner', 'Activity')),
  target_id uuid NOT NULL,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  reservation_id uuid REFERENCES reservations(id) ON DELETE SET NULL,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  title text,
  content text,
  pros jsonb DEFAULT '[]'::jsonb,
  cons jsonb DEFAULT '[]'::jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view published reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Staff can manage reviews" ON reviews FOR ALL TO authenticated USING (check_user_role(ARRAY['Admin', 'Staff']));

CREATE TABLE IF NOT EXISTS review_helpfuls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES reviews(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(review_id, user_id)
);

ALTER TABLE review_helpfuls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can toggle helpful" ON review_helpfuls FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 8. COMMUNITY - EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  end_date timestamptz,
  location text,
  latitude numeric,
  longitude numeric,
  location_type text DEFAULT 'Offline',
  max_participants integer,
  image_url text,
  status text DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Ongoing', 'Completed', 'Cancelled')),
  organizer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view events" ON events FOR SELECT USING (true);
CREATE POLICY "Admins/Organizers manage events" ON events FOR ALL USING (check_user_role(ARRAY['Admin']) OR auth.uid() = organizer_id);

CREATE TABLE IF NOT EXISTS event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text DEFAULT 'Registered',
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage participation" ON event_participants FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 9. USER DATA
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_vehicle_id uuid REFERENCES rental_vehicles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(rental_vehicle_id, user_id)
);

ALTER TABLE vehicle_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage vehicle favorites" ON vehicle_favorites FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS partner_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES partners(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(partner_id, user_id)
);

ALTER TABLE partner_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage partner favorites" ON partner_favorites FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  read_at timestamptz,
  story_id uuid,
  question_id uuid,
  answer_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  origin text,
  destination text,
  origin_lat numeric,
  origin_lng numeric,
  dest_lat numeric,
  dest_lng numeric,
  description text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public routes are visible" ON routes FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users manage routes" ON routes FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS route_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES routes(id) ON DELETE CASCADE,
  partner_id uuid REFERENCES partners(id) ON DELETE SET NULL,
  stop_order integer NOT NULL,
  name text,
  address text,
  latitude numeric,
  longitude numeric,
  notes text
);

ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visible if route is visible" ON route_stops FOR SELECT USING (EXISTS (SELECT 1 FROM routes WHERE id = route_stops.route_id AND (is_public = true OR user_id = auth.uid())));

-- ============================================================================
-- 10. OPERATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS rental_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id) ON DELETE CASCADE,
  checklist_type text CHECK (checklist_type IN ('pre_rental', 'handover', 'return')),
  checklist_data jsonb DEFAULT '{}'::jsonb,
  completed_by uuid REFERENCES users(id),
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rental_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage checklists" ON rental_checklists FOR ALL USING (check_user_role(ARRAY['Admin', 'Staff']));

CREATE TABLE IF NOT EXISTS equipment_preparations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id) ON DELETE CASCADE,
  equipment_id text,
  equipment_name text,
  quantity integer,
  prepared boolean DEFAULT false,
  prepared_at timestamptz,
  prepared_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE equipment_preparations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage preparations" ON equipment_preparations FOR ALL USING (check_user_role(ARRAY['Admin', 'Staff']));

CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name text,
  email text,
  phone_number text,
  subject text,
  message text,
  category text,
  category_id uuid REFERENCES categories(id),
  status text DEFAULT 'pending',
  priority text DEFAULT 'normal',
  admin_notes text,
  assigned_to uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage contacts" ON contacts FOR ALL USING (check_user_role(ARRAY['Admin', 'Staff']));
CREATE POLICY "Authenticated users can submit contacts" ON contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anonymous users can submit contacts" ON contacts FOR INSERT TO anon WITH CHECK (true);

CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES users(id),
  action text NOT NULL,
  target_table text,
  target_id text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view logs" ON admin_logs FOR SELECT USING (check_user_role(ARRAY['Admin']));
CREATE POLICY "Staff can insert logs" ON admin_logs FOR INSERT TO authenticated WITH CHECK (check_user_role(ARRAY['Admin', 'Staff']));

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text,
  priority text DEFAULT 'normal',
  author_id uuid REFERENCES users(id),
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view announcements" ON announcements FOR SELECT USING (published = true);
CREATE POLICY "Admins manage announcements" ON announcements FOR ALL USING (check_user_role(ARRAY['Admin', 'Staff']));

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rental_vehicles_updated_at BEFORE UPDATE ON rental_vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_story_questions_updated_at BEFORE UPDATE ON story_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_story_answers_updated_at BEFORE UPDATE ON story_answers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON answers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rental_checklists_updated_at BEFORE UPDATE ON rental_checklists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RANK SYSTEM FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_total_spent(user_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_amount NUMERIC;
BEGIN
  SELECT COALESCE(SUM(r.total), 0) INTO total_amount
  FROM reservations r
  WHERE r.user_id = user_uuid AND r.status = 'Completed';
  RETURN total_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_total_likes(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_likes_count INTEGER;
BEGIN
  SELECT COALESCE(COUNT(*), 0) INTO total_likes_count
  FROM story_likes sl
  JOIN stories s ON sl.story_id = s.id
  WHERE s.author_id = user_uuid;
  RETURN total_likes_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_total_posts(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_posts_count INTEGER;
BEGIN
  SELECT COALESCE(COUNT(*), 0) INTO total_posts_count
  FROM stories
  WHERE author_id = user_uuid AND status = 'Published';
  RETURN total_posts_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION determine_user_rank(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  total_spent NUMERIC;
  total_likes INTEGER;
  total_posts INTEGER;
  rank_settings JSONB;
  new_rank TEXT := 'Bronze';
BEGIN
  total_spent := calculate_total_spent(user_uuid);
  total_likes := calculate_total_likes(user_uuid);
  total_posts := calculate_total_posts(user_uuid);

  SELECT ss.rank_settings INTO rank_settings FROM system_settings ss LIMIT 1;

  IF (rank_settings->'ranks'->'Platinum'->>'min_amount')::NUMERIC <= total_spent
     OR (rank_settings->'ranks'->'Platinum'->>'min_likes')::INTEGER <= total_likes
     OR (rank_settings->'ranks'->'Platinum'->>'min_posts')::INTEGER <= total_posts THEN
    new_rank := 'Platinum';
  ELSIF (rank_settings->'ranks'->'Gold'->>'min_amount')::NUMERIC <= total_spent
     OR (rank_settings->'ranks'->'Gold'->>'min_likes')::INTEGER <= total_likes
     OR (rank_settings->'ranks'->'Gold'->>'min_posts')::INTEGER <= total_posts THEN
    new_rank := 'Gold';
  ELSIF (rank_settings->'ranks'->'Silver'->>'min_amount')::NUMERIC <= total_spent
     OR (rank_settings->'ranks'->'Silver'->>'min_likes')::INTEGER <= total_likes
     OR (rank_settings->'ranks'->'Silver'->>'min_posts')::INTEGER <= total_posts THEN
    new_rank := 'Silver';
  END IF;

  RETURN new_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_user_rank(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  new_rank TEXT;
BEGIN
  new_rank := determine_user_rank(user_uuid);
  UPDATE users
  SET rank = new_rank, updated_at = NOW()
  WHERE id = user_uuid AND rank != new_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INITIAL SEED DATA
-- ============================================================================

-- システム設定の初期レコード
INSERT INTO system_settings (key, value, description, payment_method)
VALUES ('general', 'true', 'レンタル機能の有効/無効を含むシステム全般設定', 'both')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description)
VALUES ('max_rental_days', '14', 'レンタル可能な最大連続日数')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- SCHEMA UPDATES (既存DBへの追加カラム)
-- ============================================================================

-- イベントテーブルに不足カラムを追加
ALTER TABLE events ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE events ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS status text DEFAULT 'Upcoming';

-- アクティビティテーブルに不足カラムを追加
ALTER TABLE activities ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES partners(id) ON DELETE SET NULL;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS duration_minutes integer;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS difficulty_level text DEFAULT 'Beginner';
ALTER TABLE activities ADD COLUMN IF NOT EXISTS available_seasons jsonb DEFAULT '[]'::jsonb;

-- ============================================================================
-- RANK AUTO-UPDATE TRIGGERS（ランク自動更新トリガー）
-- ============================================================================

-- 1. いいね追加/削除時 → 投稿著者のランクを自動更新
CREATE OR REPLACE FUNCTION trigger_update_rank_on_like()
RETURNS TRIGGER AS $$
DECLARE
  story_author_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT author_id INTO story_author_id FROM stories WHERE id = OLD.story_id;
  ELSE
    SELECT author_id INTO story_author_id FROM stories WHERE id = NEW.story_id;
  END IF;

  IF story_author_id IS NOT NULL THEN
    PERFORM update_user_rank(story_author_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_rank_on_like ON story_likes;
CREATE TRIGGER trg_update_rank_on_like
  AFTER INSERT OR DELETE ON story_likes
  FOR EACH ROW EXECUTE FUNCTION trigger_update_rank_on_like();

-- 2. 体験記の公開時 → 著者のランクを自動更新
CREATE OR REPLACE FUNCTION trigger_update_rank_on_story_publish()
RETURNS TRIGGER AS $$
BEGIN
  -- 新規公開 or ステータスが Published に変更されたとき
  IF NEW.status = 'Published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'Published') THEN
    PERFORM update_user_rank(NEW.author_id);
  END IF;
  -- 公開取消の場合もランク再計算
  IF TG_OP = 'UPDATE' AND OLD.status = 'Published' AND NEW.status != 'Published' THEN
    PERFORM update_user_rank(NEW.author_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_rank_on_story_publish ON stories;
CREATE TRIGGER trg_update_rank_on_story_publish
  AFTER INSERT OR UPDATE OF status ON stories
  FOR EACH ROW EXECUTE FUNCTION trigger_update_rank_on_story_publish();

-- 3. 予約完了時 → ユーザーのランクを自動更新
CREATE OR REPLACE FUNCTION trigger_update_rank_on_reservation_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'Completed') THEN
    PERFORM update_user_rank(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_rank_on_reservation_complete ON reservations;
CREATE TRIGGER trg_update_rank_on_reservation_complete
  AFTER INSERT OR UPDATE OF status ON reservations
  FOR EACH ROW EXECUTE FUNCTION trigger_update_rank_on_reservation_complete();
