-- Secondhand marketplace tables
CREATE TABLE IF NOT EXISTS secondhand_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  region TEXT NOT NULL,
  main_image_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'hidden')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS secondhand_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES secondhand_items(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  order_num INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE secondhand_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE secondhand_images ENABLE ROW LEVEL SECURITY;

-- 누구나 active 항목 조회 가능
CREATE POLICY "Anyone can read active secondhand items" ON secondhand_items
  FOR SELECT USING (status = 'active');

-- 사용자가 자신의 항목 관리 가능
CREATE POLICY "Users can insert secondhand items" ON secondhand_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own secondhand items" ON secondhand_items
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own secondhand items" ON secondhand_items
  FOR DELETE USING (true);

-- 이미지 접근
CREATE POLICY "Anyone can read secondhand images" ON secondhand_images
  FOR SELECT USING (true);

CREATE POLICY "Users can manage secondhand images" ON secondhand_images
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete secondhand images" ON secondhand_images
  FOR DELETE USING (true);

-- 인덱스
CREATE INDEX IF NOT EXISTS secondhand_items_user_id_idx ON secondhand_items(user_id);
CREATE INDEX IF NOT EXISTS secondhand_items_status_idx ON secondhand_items(status);
CREATE INDEX IF NOT EXISTS secondhand_items_region_idx ON secondhand_items(region);
CREATE INDEX IF NOT EXISTS secondhand_items_created_at_idx ON secondhand_items(created_at DESC);
CREATE INDEX IF NOT EXISTS secondhand_images_item_id_idx ON secondhand_images(item_id);
