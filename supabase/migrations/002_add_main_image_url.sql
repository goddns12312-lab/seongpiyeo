-- Add main_image_url column to listings table
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS main_image_url TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS listings_main_image_url_idx ON listings(main_image_url) WHERE main_image_url IS NOT NULL;
