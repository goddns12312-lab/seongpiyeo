export type Profile = {
  id: string;
  email: string;
  nickname: string;
  phone?: string;
  role: 'user' | 'admin';
  created_at: string;
};

export type Listing = {
  id: string;
  user_id?: string;
  idx?: string;
  title: string;
  description?: string;
  price_type: 'sale' | 'lease';
  price: number;
  deposit?: number;
  monthly_rent?: number;
  premium_price?: number;
  region: string;
  district?: string;
  address?: string;
  location?: string;
  area_sqm?: number;
  floor?: string;
  pc_count?: number;
  monthly_revenue?: number;
  monthly_profit?: number;
  facilities?: string;
  available_date?: string;
  business_license?: string;
  administrative_record?: string;
  contact?: string;
  source_url?: string;
  thumbnail_url?: string;
  main_image_url?: string;
  status: 'pending' | 'active' | 'sold' | 'hidden';
  view_count: number;
  created_at: string;
  updated_at?: string;
};

export type ListingImage = {
  id: string;
  listing_id: string;
  url: string;
  is_primary: boolean;
  order_num: number;
  created_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  category: 'free' | 'startup' | 'interior' | 'equipment' | 'exchange' | 'recruitment';
  title: string;
  content: string;
  view_count: number;
  status: 'active' | 'hidden' | 'deleted';
  created_at: string;
  updated_at?: string;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string | null;
  content: string;
  status: 'active' | 'hidden';
  created_at: string;
  updated_at?: string;
};

export type JobImage = {
  url: string;
  order: number;
  is_primary: boolean;
};

export type Job = {
  id: string;
  user_id: string;
  category: 'recruitment' | 'job_seeker';
  slug: string;
  title: string;
  company_name?: string;
  description: string;
  region: string;
  employment_type?: string;
  salary?: string;
  contact?: string;
  images?: JobImage[];
  view_count: number;
  status: 'active' | 'hidden' | 'closed';
  expires_at?: string;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
};

export type Banner = {
  id: string;
  title: string;
  image_url: string;
  link_url?: string;
  position: 'top' | 'sidebar' | 'bottom';
  is_active: boolean;
  order_num: number;
  created_at: string;
};

export const REGIONS = [
  '서울', '경기도', '인천', '부산', '대구', '광주', '대전', '울산', '세종',
  '강원도', '충청북도', '충청남도', '전라북도', '전라남도', '경상북도', '경상남도', '제주도'
];

export const CATEGORY_LABELS: Record<string, string> = {
  free: '자유게시판',
  startup: '창업 & 사업',
  interior: '인테리어 & 시설',
  equipment: '장비 & 기자재',
  exchange: '환수정보',
  recruitment: '구인구직',
};

export const PRICE_TYPE_LABELS: Record<string, string> = {
  sale: '매매',
  lease: '임차',
};

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  'full_time': '정규직',
  'contract': '계약직',
  'part_time': '아르바이트',
};
