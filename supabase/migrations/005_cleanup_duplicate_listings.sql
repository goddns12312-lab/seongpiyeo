-- Clean up duplicate listings, keeping only the most recent one for each idx
WITH ranked_duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY idx ORDER BY created_at DESC) as rn
  FROM listings
  WHERE idx IS NOT NULL
)
DELETE FROM listings
WHERE id IN (
  SELECT id FROM ranked_duplicates WHERE rn > 1
);

-- Also clean up any listings without idx that might be orphaned
DELETE FROM listings
WHERE idx IS NULL AND status = 'active';
