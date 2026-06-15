'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { getSession } from '@/lib/auth';
import { uploadFilesToStorage } from '@/lib/image-upload';

const REGIONS = ['서울', '경기', '인천', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

export default function SecondhandNewPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    region: '서울'
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (!images.some(img => img.name === file.name && img.size === file.size)) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImagePreviews(prev => [...prev, event.target?.result as string]);
        };
        reader.readAsDataURL(file);
        setImages(prev => [...prev, file]);
      }
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    const supabase = createClient();
    return uploadFilesToStorage(supabase, 'listings', images, 'secondhand');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title || !formData.price) {
      setError('제목과 가격은 필수입니다.');
      return;
    }

    setSubmitting(true);

    try {
      // pc_bang_session 쿠키 확인 (Supabase auth 아님)
      const session = getSession();

      if (!session) {
        setError('로그인이 필요합니다');
        setSubmitting(false);
        return;
      }

      // 이미지 업로드
      let uploadedImages: string[] = [];
      if (images.length > 0) {
        uploadedImages = await uploadImages();
      }

      // API route로 물품 등록
      const response = await fetch('/api/secondhand/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': session.id,
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: formData.price,
          region: formData.region,
          imageUrls: uploadedImages,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || '물품 등록에 실패했습니다');
      } else if (result.success && result.itemId) {
        router.push(`/secondhand/${result.itemId}`);
      } else {
        setError('물품 등록에 실패했습니다');
      }
    } catch (err) {
      console.error('등록 실패:', err);
      setError('물품 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-bg-primary min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-text-primary mb-8">물품 등록</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-bg-secondary border border-border-light rounded-lg p-8">
          {/* 제목 */}
          <div className="mb-6">
            <label className="block text-text-primary font-semibold mb-2">제목 *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="물품 제목을 입력하세요"
              className="w-full bg-bg-tertiary border border-border-light rounded-lg px-4 py-2 text-text-primary placeholder-text-secondary focus:outline-none focus:border-gold"
              required
            />
          </div>

          {/* 설명 */}
          <div className="mb-6">
            <label className="block text-text-primary font-semibold mb-2">설명</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="물품 설명을 입력하세요 (선택사항)"
              className="w-full bg-bg-tertiary border border-border-light rounded-lg px-4 py-2 text-text-primary placeholder-text-secondary focus:outline-none focus:border-gold h-32 resize-none"
            />
          </div>

          {/* 가격 */}
          <div className="mb-6">
            <label className="block text-text-primary font-semibold mb-2">가격 (만원) *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="예: 50"
              className="w-full bg-bg-tertiary border border-border-light rounded-lg px-4 py-2 text-text-primary placeholder-text-secondary focus:outline-none focus:border-gold"
              required
            />
          </div>

          {/* 지역 */}
          <div className="mb-6">
            <label className="block text-text-primary font-semibold mb-2">지역 *</label>
            <select
              name="region"
              value={formData.region}
              onChange={handleInputChange}
              className="w-full bg-bg-tertiary border border-border-light rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-gold"
            >
              {REGIONS.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          {/* 이미지 */}
          <div className="mb-8">
            <label className="block text-text-primary font-semibold mb-2">이미지 (선택사항)</label>
            <div className="border-2 border-dashed border-border-light rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="imageInput"
              />
              <label htmlFor="imageInput" className="cursor-pointer">
                <p className="text-text-secondary mb-2">클릭하여 이미지를 선택하거나 드래그하세요</p>
              </label>
            </div>

            {/* 선택된 이미지 미리보기 */}
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <div className="bg-bg-tertiary rounded-lg overflow-hidden aspect-square flex items-center justify-center">
                      <img
                        src={preview}
                        alt={`미리보기 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-gold text-bg-primary text-xs px-2 py-1 rounded font-semibold">
                          대표
                        </div>
                      )}
                    </div>
                    <p className="text-text-secondary text-xs sm:text-sm mt-1 truncate">{images[index].name}</p>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-600 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs sm:text-sm font-bold hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={submitting}
            >
              {submitting ? '등록 중...' : '등록하기'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => router.push('/secondhand')}
              disabled={submitting}
            >
              취소
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
