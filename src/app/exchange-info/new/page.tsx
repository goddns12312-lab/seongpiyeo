'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export default function NewPostPage() {
  const router = useRouter();
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 5 - images.length); // 최대 5개까지만
    const validFiles = newFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다');
        return false;
      }
      return true;
    });

    setImages([...images, ...validFiles]);

    // 미리보기 생성
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-gold', 'bg-gold/5');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-gold', 'bg-gold/5');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-gold', 'bg-gold/5');
    handleImageSelect(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const category = formData.get('category') as string;
    const content = formData.get('content') as string;

    // 유효성 검사
    if (!title || !category || !content) {
      setError('제목, 카테고리, 내용은 필수입니다');
      setIsSubmitting(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError('로그인이 필요합니다');
        setIsSubmitting(false);
        return;
      }

      const postData = {
        title,
        category,
        content,
        status: 'active',
      };

      const response = await fetch('/api/exchange-info/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(postData),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || '게시글 작성에 실패했습니다');
      } else if (result.success && result.postId) {
        // 성공 후 상세 페이지로 이동
        router.push(`/exchange-info/${result.postId}`);
      } else {
        setError('게시글 작성에 실패했습니다');
      }
    } catch (err) {
      setError('게시글 작성 중 오류가 발생했습니다');
      console.error('Post creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back Button */}
        <Link href="/exchange-info" className="inline-flex items-center text-gold hover:text-gold-light mb-6">
          ← 목록으로
        </Link>

        {/* Form */}
        <div className="bg-bg-secondary border border-border-light rounded-lg p-8">
          <h1 className="text-3xl font-bold text-text-primary mb-8">게시글 작성</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-text-primary font-semibold mb-2">제목</label>
              <input
                type="text"
                name="title"
                placeholder="게시글 제목을 입력하세요"
                className="w-full bg-bg-primary border border-border-light rounded px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:border-gold outline-none transition"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-text-primary font-semibold mb-2">카테고리</label>
              <select name="category" className="w-full bg-bg-primary border border-border-light rounded px-4 py-3 text-text-primary focus:border-gold outline-none transition">
                <option value="">카테고리를 선택하세요</option>
                <option value="slot">슬롯 환수율</option>
                <option value="pc">성인PC 운영정보</option>
              </select>
            </div>

            {/* Content */}
            <div>
              <label className="block text-text-primary font-semibold mb-2">내용</label>
              <textarea
                name="content"
                placeholder="게시글 내용을 입력하세요"
                className="w-full bg-bg-primary border border-border-light rounded px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:border-gold outline-none transition"
                rows={10}
              />
              <p className="text-xs text-text-secondary mt-2">## 제목, - 목록 마크다운 문법을 사용할 수 있습니다</p>
            </div>

            {/* Images */}
            <div>
              <label className="block text-text-primary font-semibold mb-2">
                사진 (선택사항) {images.length > 0 && <span className="text-gold text-sm">({images.length}/5)</span>}
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="border-2 border-dashed border-border-light rounded-lg p-6 text-center hover:border-gold transition cursor-pointer"
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                  onChange={(e) => handleImageSelect(e.target.files)}
                />
                <label htmlFor="image-upload" className="cursor-pointer block">
                  <div className="text-4xl mb-3">📸</div>
                  <p className="text-text-primary font-medium mb-1">사진을 클릭하거나 드래그해서 업로드하세요</p>
                  <p className="text-xs text-text-secondary">JPG, PNG (최대 5MB, 최대 5개)</p>
                </label>
              </div>

              {/* Image Preview */}
              {previews.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`preview-${index}`}
                        className="w-full h-24 object-cover rounded border border-border-light"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gold hover:bg-gold-light disabled:bg-gold/50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded transition"
              >
                {isSubmitting ? '작성 중...' : '작성 완료'}
              </button>
              <Link href="/exchange-info" className="flex-1">
                <Button variant="secondary" className="w-full" disabled={isSubmitting}>취소</Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
