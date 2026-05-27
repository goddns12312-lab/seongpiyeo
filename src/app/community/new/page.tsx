'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getSession } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { CATEGORY_LABELS } from '@/types';

export default function NewPostPage() {
  const router = useRouter();
  const [category, setCategory] = useState<keyof typeof CATEGORY_LABELS>('free');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const session = getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const supabase = createClient();
      const { data, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: session.id,
          category,
          title,
          content,
          status: 'active',
        })
        .select()
        .single();

      if (postError) {
        setError('게시글 작성 실패: ' + postError.message);
        return;
      }

      router.push(`/community/${data.id}`);
    } catch (err) {
      setError('게시글 작성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-primary min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-text-primary mb-8">게시글 작성</h1>

        {error && (
          <div className="bg-red-900/20 border border-red-900 text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-bg-secondary border border-border-light rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-text-primary text-sm font-medium mb-2">카테고리 *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as keyof typeof CATEGORY_LABELS)}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
            >
              {(Object.entries(CATEGORY_LABELS) as Array<[string, string]>).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-text-primary text-sm font-medium mb-2">제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
              required
            />
          </div>

          <div>
            <label className="block text-text-primary text-sm font-medium mb-2">내용 *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              rows={10}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold resize-none"
              required
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="primary"
              size="lg"
              isLoading={loading}
              type="submit"
              className="flex-1"
            >
              게시글 작성
            </Button>
            <Button
              variant="secondary"
              size="lg"
              type="button"
              onClick={() => router.back()}
            >
              취소
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
