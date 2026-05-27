-- profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  nickname TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can read all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can create their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- listings table
CREATE TABLE listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  price_type TEXT CHECK (price_type IN ('sale', 'lease')),
  price INTEGER NOT NULL,
  deposit INTEGER,
  monthly_rent INTEGER,
  region TEXT NOT NULL,
  district TEXT,
  address TEXT,
  area_sqm INTEGER,
  pc_count INTEGER,
  monthly_revenue INTEGER,
  monthly_profit INTEGER,
  source_url TEXT UNIQUE,
  thumbnail_url TEXT,
  main_image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'sold', 'hidden')),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active listings" ON listings FOR SELECT USING (status = 'active');
CREATE POLICY "Users can read their own listings" ON listings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create listings" ON listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own listings" ON listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Only admin can delete listings" ON listings FOR DELETE USING (false);

-- listing_images table
CREATE TABLE listing_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  order_num INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read listing images" ON listing_images FOR SELECT USING (true);
CREATE POLICY "Users can manage their listing images" ON listing_images FOR ALL USING (
  EXISTS (SELECT 1 FROM listings WHERE listings.id = listing_images.listing_id AND listings.user_id = auth.uid())
);

-- posts table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  category TEXT CHECK (category IN ('free', 'startup', 'interior', 'equipment')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active posts" ON posts FOR SELECT USING (status = 'active');
CREATE POLICY "Users can read their own posts" ON posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);

-- comments table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active comments" ON comments FOR SELECT USING (status = 'active');
CREATE POLICY "Users can read their own comments" ON comments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);

-- banners table
CREATE TABLE banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  position TEXT DEFAULT 'top' CHECK (position IN ('top', 'sidebar', 'bottom')),
  is_active BOOLEAN DEFAULT true,
  order_num INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active banners" ON banners FOR SELECT USING (is_active = true);

-- Indexes for performance
CREATE INDEX listings_region_idx ON listings(region);
CREATE INDEX listings_status_idx ON listings(status);
CREATE INDEX listings_user_id_idx ON listings(user_id);
CREATE INDEX posts_category_idx ON posts(category);
CREATE INDEX posts_user_id_idx ON posts(user_id);
CREATE INDEX comments_post_id_idx ON comments(post_id);
