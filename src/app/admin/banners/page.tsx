'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createBanner, updateBanner, deleteBanner } from '@/lib/actions';
import { getSession } from '@/lib/auth';
import { Button } from '@/components/ui/Button';

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url?: string;
  position: string;
  is_active: boolean;
  order_num: number;
}

const POSITION_OPTIONS = [
  { value: 'top', label: '메인 상단' },
  { value: 'bottom', label: '메인 하단' },
  { value: 'listing-list-top', label: '매물목록 상단' },
  { value: 'listing-detail-sidebar', label: '매물상세 사이드' },
  { value: 'sidebar', label: '매물상세 사이드 (레거시)' },
];

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link_url: '',
    position: 'main-top',
    is_active: true,
    order_num: 0,
  });

  useEffect(() => {
    setTimeout(() => {
      const session = getSession();
      if (!session) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      if (session.role === 'admin') {
        setIsAdmin(true);
        loadBanners();
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    }, 100);
  }, []);

  const loadBanners = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('order_num', { ascending: true });

      if (error) {
        console.error('Error loading banners:', error);
      }

      setBanners(data || []);
    } catch (err) {
      console.error('Failed to load banners:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.image_url) {
      alert('제목과 이미지 URL은 필수입니다.');
      return;
    }

    if (editingId) {
      const result = await updateBanner(editingId, formData);
      if (result.error) {
        alert('배너 수정 실패: ' + result.error);
        return;
      }
      alert('배너가 수정되었습니다.');
    } else {
      const result = await createBanner(formData);
      if (result.error) {
        alert('배너 추가 실패: ' + result.error);
        return;
      }
      alert('배너가 추가되었습니다.');
    }

    setFormData({
      title: '',
      image_url: '',
      link_url: '',
      position: 'main-top',
      is_active: true,
      order_num: 0,
    });
    setEditingId(null);
    loadBanners();
  };

  const handleEdit = (banner: Banner) => {
    setFormData({
      title: banner.title,
      image_url: banner.image_url,
      link_url: banner.link_url || '',
      position: banner.position,
      is_active: banner.is_active,
      order_num: banner.order_num,
    });
    setEditingId(banner.id);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    const result = await deleteBanner(id);
    if (result.error) {
      alert('배너 삭제 실패: ' + result.error);
      return;
    }
    alert('배너가 삭제되었습니다.');
    loadBanners();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

      const { data, error } = await supabase.storage
        .from('listings')
        .upload(`banners/${fileName}`, file);

      if (error) {
        alert('이미지 업로드 실패: ' + error.message);
        console.error('Upload error:', error);
        return;
      }

      if (data) {
        const { data: urlData } = supabase.storage
          .from('listings')
          .getPublicUrl(`banners/${fileName}`);

        setFormData((prev) => ({
          ...prev,
          image_url: urlData.publicUrl,
        }));
        alert('이미지 업로드 완료!');
      }
    } catch (err) {
      alert('이미지 업로드 중 오류가 발생했습니다.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (isAdmin === null || (isAdmin && loading)) {
    return (
      <div className="text-center py-12 text-text-secondary">
        로딩 중...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12 text-text-secondary">
        <p className="mb-4">관리자만 접근할 수 있습니다.</p>
        <p className="text-sm">로그아웃 후 관리자 계정으로 로그인해주세요.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-8">배너 관리</h1>

      {/* Form */}
      <div className="bg-bg-secondary border border-border-light rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          {editingId ? '배너 수정' : '새 배너 추가'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-text-secondary text-sm mb-2">제목 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
              placeholder="배너 제목"
              required
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-2">이미지 *</label>
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gold file:text-bg-primary hover:file:bg-gold-light disabled:opacity-50"
                />
                {uploading && <span className="text-gold text-sm">업로드 중...</span>}
              </div>
              <p className="text-text-muted text-xs">또는 URL 직접 입력:</p>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
                placeholder="https://example.com/image.jpg"
                required
              />
              {formData.image_url && (
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-full max-h-48 object-cover rounded border border-border-light"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-2">링크 URL</label>
            <input
              type="url"
              value={formData.link_url}
              onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
              placeholder="https://example.com (선택사항)"
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-2">위치 *</label>
            <select
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
            >
              {POSITION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-sm mb-2">순서</label>
              <input
                type="number"
                value={formData.order_num}
                onChange={(e) => setFormData({ ...formData, order_num: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-text-secondary">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                활성화
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="primary" type="submit" className="flex-1">
              {editingId ? '수정하기' : '추가하기'}
            </Button>
            {editingId && (
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    title: '',
                    image_url: '',
                    link_url: '',
                    position: 'main-top',
                    is_active: true,
                    order_num: 0,
                  });
                }}
                className="flex-1"
              >
                취소
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Banners List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text-primary mb-4">배너 목록</h2>
        {banners.length === 0 ? (
          <p className="text-text-secondary">배너가 없습니다.</p>
        ) : (
          banners.map((banner) => (
            <div
              key={banner.id}
              className="bg-bg-secondary border border-border-light rounded-lg p-4 flex gap-4 items-start"
            >
              <img
                src={banner.image_url}
                alt={banner.title}
                className="w-32 h-24 object-cover rounded flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-banner.png';
                }}
              />
              <div className="flex-1">
                <h3 className="text-text-primary font-semibold text-lg mb-1">{banner.title}</h3>
                <p className="text-text-secondary text-sm mb-1">
                  {POSITION_OPTIONS.find(op => op.value === banner.position)?.label || banner.position}
                </p>
                <p className="text-text-secondary text-sm mb-2">{banner.link_url || '링크 없음'}</p>
                <div className="flex gap-2 text-text-muted text-xs">
                  <span>{banner.is_active ? '✓ 활성' : '비활성'}</span>
                  <span>순서: {banner.order_num}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="secondary" size="sm" onClick={() => handleEdit(banner)}>
                  수정
                </Button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="px-3 py-1 bg-red-900/20 border border-red-900 text-red-200 text-sm rounded hover:bg-red-900/30 transition"
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
