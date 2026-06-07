-- Migration: Add 'exchange' category to posts table
-- Date: 2026-06-07
-- Reason: Enable exchange-info board with category='exchange' for posts

ALTER TABLE posts
DROP CONSTRAINT IF EXISTS posts_category_check;

ALTER TABLE posts
ADD CONSTRAINT posts_category_check
CHECK (
  category IN (
    'free',
    'startup',
    'interior',
    'equipment',
    'exchange'
  )
);
