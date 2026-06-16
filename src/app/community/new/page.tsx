'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { getSession } from '@/lib/auth-session';
import { COMMUNITY_CATEGORIES, CommunityCategory } from '@/lib/community-categories';
import { PostEditor } from '@/components/community/PostEditor';
import { compressImageFile } from '@/lib/image-upload';

export default function NewPostPage() {
  const router = useRouter();
  const [category, setCategory] = useState<CommunityCategory>('free');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    if (cat && cat in COMMUNITY_CATEGORIES) {
      setCategory(cat as CommunityCategory);
    }
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleImageSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 5 - images.length);
    setImages((prev) => [...prev, ...newFiles]);
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setPreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (sessionId: string): Promise<string[]> => {
    if (!images.length) return [];
    setUploadingImages(true);
    const urls: string[] = [];

    for (const file of images) {
      const compressed = await compressImageFile(file);
      const formData = new FormData();
      formData.append('file', compressed);
      const res = await fetch('/api/upload-post-image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (data.url) urls.push(data.url);
    }

    setUploadingImages(false);
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, asDraft = false) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(formRef.current || e.currentTarget);
    const title = formData.get('title') as string;
    const category = formData.get('category') as string;
    const content = formData.get('content') as string;

    if (!asDraft && (!title || !category || !content)) {
      setError('제목, 카테고리, 내용은 필수입니다');
      setIsSubmitting(false);
      return;
    }

    try {
      const session = getSession();
      if (!session) {
        setError('로그인이 필요합니다');
        setIsSubmitting(false);
        return;
      }

      const imageUrls = await uploadImages(session.id);

      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          category,
          content,
          imageUrls,
          status: asDraft ? 'draft' : 'active',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || '게시글 작성에 실패했습니다');
      } else if (result.success && result.postId) {
        if (asDraft) {
          localStorage.removeItem('community-draft-new');
          router.push('/mypage');
        } else {
          localStorage.removeItem('community-draft-new');
          router.push(`/community/${result.postId}`);
        }
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
        <Link href="/community" className="inline-flex items-center text-gold hover:text-gold-light mb-6">
          ← 목록으로
        </Link>

        <div className="bg-bg-secondary border border-border-light rounded-lg p-8">
          <h1 className="text-3xl font-bold text-text-primary mb-8">게시글 작성</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <form ref={formRef} onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            <div>
              <label className="block text-text-primary font-semibold mb-2">제목</label>
              <input
                type="text"
                name="title"
                placeholder="게시글 제목을 입력하세요"
                className="w-full bg-bg-primary border border-border-light rounded px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:border-gold outline-none transition"
              />
            </div>

            <div>
              <label className="block text-text-primary font-semibold mb-2">카테고리</label>
              <select
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as CommunityCategory)}
                className="w-full bg-bg-primary border border-border-light rounded px-4 py-3 text-text-primary focus:border-gold outline-none transition"
              >
                {(Object.entries(COMMUNITY_CATEGORIES) as [CommunityCategory, (typeof COMMUNITY_CATEGORIES)[CommunityCategory]][]).map(
                  ([key, cat]) => (
                    <option key={key} value={key}>
                      {cat.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block text-text-primary font-semibold mb-2">내용</label>
              <PostEditor storageKey="community-draft-new" />
            </div>

            <div>
              <label className="block text-text-primary font-semibold mb-2">
                사진 (선택) {images.length > 0 && <span className="text-gold text-sm">({images.length}/5)</span>}
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageSelect(e.target.files)}
                className="w-full text-sm text-text-secondary"
              />
              {previews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img src={preview} alt="" className="w-full h-20 object-cover rounded border border-border-light" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting || uploadingImages}
                className="flex-1 bg-gold hover:bg-gold-light disabled:bg-gold/50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded transition"
              >
                {isSubmitting ? '작성 중...' : '작성 완료'}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  if (formRef.current) {
                    handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>, true);
                  }
                }}
                className="px-4 py-3 bg-bg-tertiary border border-border-light text-text-primary rounded font-semibold text-sm hover:border-gold"
              >
                임시저장
              </button>
              <Link href="/community" className="flex-1">
                <Button variant="secondary" className="w-full" disabled={isSubmitting}>취소</Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
