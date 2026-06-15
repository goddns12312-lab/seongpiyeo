-- 회원 상태: active(정상) | suspended(정지) | deleted(탈퇴)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_status_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_account_status_check
  CHECK (account_status IN ('active', 'suspended', 'deleted'));

UPDATE profiles SET account_status = 'active' WHERE account_status IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON profiles(account_status);
