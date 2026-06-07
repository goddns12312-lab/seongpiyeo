'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { updateSecondhandItem } from '@/lib/actions';

interface Props {
  itemId: string;
  initialData: {
    id: string;
    title: string;
    description: string;
    price: number;
    region: string;
    main_image_url?: string;
  };
  regions: string[];
}

export default function SecondhandEditClient({ itemId, initialData, regions }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description);
  const [price, setPrice] = useState(initialData.price.toString());
  const [region, setRegion] = useState(initialData.region);
  const [imageUrl, setImageUrl] = useState(initialData.main_image_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    if (!title.trim() || !description.trim() || !price || !region) {
      setError('필수 항목을 모두 입력하세요');
      setIsSaving(false);
      return;
    }

    const result = await updateSecondhandItem(itemId, {
      title: title.trim(),
      description: description.trim(),
      price: parseInt(price),
      region,
      main_image_url: imageUrl.trim() || null,
    });

    if (result.error) {
      setError(result.error);
      setIsSaving(false);
    } else if (result.success) {
      router.push(`/secondhand/${itemId}`);
    }
  };

  return (
    <div className="bg-bg-secondary border border-border-light rounded-lg p-8">
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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="물품명을 입력하세요"
            className="w-full bg-bg-primary border border-border-light rounded px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:border-gold outline-none transition"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-text-primary font-semibold mb-2">가격 (만원)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="가격을 입력하세요"
            min="0"
            className="w-full bg-bg-primary border border-border-light rounded px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:border-gold outline-none transition"
          />
        </div>

        {/* Region */}
        <div>
          <label className="block text-text-primary font-semibold mb-2">지역</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full bg-bg-primary border border-border-light rounded px-4 py-3 text-text-primary focus:border-gold outline-none transition"
          >
            <option value="">지역을 선택하세요</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-text-primary font-semibold mb-2">설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="물품 설명을 입력하세요"
            className="w-full bg-bg-primary border border-border-light rounded px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:border-gold outline-none transition"
            rows={6}
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-text-primary font-semibold mb-2">이미지 URL (선택)</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full bg-bg-primary border border-border-light rounded px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:border-gold outline-none transition"
          />
          <p className="text-xs text-text-secondary mt-2">
            현재 이미지: {imageUrl ? imageUrl.substring(0, 50) + '...' : '없음'}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 bg-gold hover:bg-gold-light disabled:bg-gold/50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded transition"
          >
            {isSaving ? '저장 중...' : '수정 완료'}
          </button>
          <Link href={`/secondhand/${itemId}`} className="flex-1">
            <Button variant="secondary" className="w-full" disabled={isSaving}>
              취소
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
