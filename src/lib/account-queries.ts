/** 마이페이지·관리자 페이지용 경량 SELECT */

export const MY_PROFILE_SELECT = 'id, nickname, email, phone, role, created_at';

export const MY_POST_SELECT = 'id, title, category, view_count, status, created_at, user_id';

export const ADMIN_LISTING_SELECT =
  'id, title, price, price_type, region, status, created_at, monthly_rent, premium_price, user_id';

export const ADMIN_POST_SELECT = 'id, title, category, status, created_at, view_count';

export const ADMIN_USER_SELECT = 'id, nickname, phone, role, created_at';

export const ADMIN_BANNER_SELECT =
  'id, title, image_url, link_url, position, is_active, order_num';
