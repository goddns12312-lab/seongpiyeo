'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getSession, AuthSession } from '@/lib/auth-session';
import { REGIONS, EMPLOYMENT_TYPE_LABELS } from '@/types';
import { Button } from '@/components/ui/Button';
import { showToast, Toast } from '@/components/ui/Toast';
import { compressImageFile } from '@/lib/image-upload';

export default function NewJobPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [category, setCategory] = useState<'recruitment' | 'job_seeker'>('recruitment');
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [region, setRegion] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [salary, setSalary] = useState('');
  const [contact, setContact] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    const session = getSession();
    console.log('[jobs/new] 페이지 로드 - 세션 확인:', session ? `로그인됨 (${session.id})` : '미로그인');

    if (!session) {
      console.log('[jobs/new] 로그인되지 않았습니다. /login으로 이동합니다.');
      router.push('/login?redirect=/jobs/new');
    } else {
      console.log('[jobs/new] 로그인 확인됨:', {
        userId: session.id,
        username: session.username,
        nickname: session.nickname,
        role: session.role,
      });

      // ⭐ 쿠키 복구 로직: localStorage에 세션이 있으면 쿠키도 설정
      console.log('[jobs/new] 쿠키 복구 시도...');
      const maxAge = 7 * 24 * 60 * 60; // 7일
      const cookieValue = encodeURIComponent(JSON.stringify(session));
      document.cookie = `pc_bang_session=${cookieValue}; max-age=${maxAge}; path=/; SameSite=Lax`;
      console.log('[jobs/new] ✓ 쿠키 설정 완료:', {
        userId: session.id,
        cookieLength: cookieValue.length,
      });

      setUser(session);
    }
    setLoading(false);
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    Array.from(files).forEach((file) => {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('이미지는 5MB 이하여야 합니다.', 'error');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('이미지 파일만 업로드 가능합니다.', 'error');
        return;
      }

      newFiles.push(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        newPreviews.push(event.target?.result as string);
        if (newPreviews.length === newFiles.length) {
          setImageFiles([...imageFiles, ...newFiles]);
          setImagePreviews([...imagePreviews, ...newPreviews]);
          setError('');
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const uploadImages = async (files: File[], userId: string): Promise<Array<{ url: string; order: number; is_primary: boolean }>> => {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      showToast('사용자 ID가 없습니다. 다시 로그인해주세요.', 'error');
      return [];
    }

    const results = await Promise.all(
      files.map(async (file, i) => {
        try {
          const compressed = await compressImageFile(file);
          const formData = new FormData();
          formData.append('file', compressed);

          const response = await fetch('/api/upload-job-image', {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });

          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error || `HTTP ${response.status}`);
          }

          return {
            url: result.url,
            order: i,
            is_primary: i === 0,
          };
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류';
          showToast(`이미지 ${i + 1} 업로드 실패: ${errorMsg}`, 'error');
          return null;
        }
      })
    );

    return results.filter((item): item is { url: string; order: number; is_primary: boolean } => item !== null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (!user) {
        const msg = '로그인이 필요합니다. /login으로 이동해주세요.';
        setError(msg);
        showToast(msg, 'error');
        setSubmitting(false);
        return;
      }

      if (!user.id) {
        const msg = '사용자 ID 오류: 다시 로그인해주세요.';
        setError(msg);
        showToast(msg, 'error');
        setSubmitting(false);
        return;
      }

      console.log('[공고 등록] ✓ 사용자 확인됨:', {
        userId: user.id,
        username: user.username,
        nickname: user.nickname,
        userIdType: typeof user.id,
        userIdLength: user.id.length,
      });

      // Validation
      if (!title.trim()) {
        setError('제목을 입력해주세요.');
        setSubmitting(false);
        return;
      }

      if (category === 'recruitment' && !companyName.trim()) {
        setError('업체명을 입력해주세요.');
        setSubmitting(false);
        return;
      }

      if (!region) {
        setError('지역을 선택해주세요.');
        setSubmitting(false);
        return;
      }

      if (!description.trim()) {
        setError('상세 설명을 입력해주세요.');
        setSubmitting(false);
        return;
      }

      console.log('[공고 등록] 기본 검증 통과');

      // Upload images if provided
      let images: Array<{ url: string; order: number; is_primary: boolean }> = [];
      if (imageFiles.length > 0) {
        console.log(`[공고 등록] ${imageFiles.length}개 이미지 업로드 시작`);
        showToast(`${imageFiles.length}개 이미지 업로드 중...`, 'info');

        images = await uploadImages(imageFiles, user.id);
        console.log(`[공고 등록] 업로드 완료:`, images.length, '개 성공');

        if (images.length === 0 && imageFiles.length > 0) {
          const msg = '모든 이미지 업로드에 실패했습니다. 파일 크기나 형식을 확인해주세요.';
          setError(msg);
          showToast(msg, 'error');
          setSubmitting(false);
          return;
        }

        if (images.length > 0 && images.length < imageFiles.length) {
          showToast(`${images.length}/${imageFiles.length}개 이미지 업로드됨`, 'info');
        } else if (images.length > 0) {
          showToast('이미지 업로드 완료!', 'success');
        }
      }

      // Generate slug from title and region
      const slug = generateSlug(title.trim(), region);

      console.log('[공고 등록] 등록 정보:', {
        userId: user.id,
        category,
        slug,
        title: title.trim(),
        region,
        imageCount: images.length,
      });

      // ⭐ API를 통해 공고 등록 (RLS 정책 우회)
      console.log('[공고 등록] API 호출: POST /api/jobs/create');

      const createResponse = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 쿠키 전달
        body: JSON.stringify({
          category,
          slug,
          title: title.trim(),
          company_name: category === 'recruitment' ? companyName.trim() : null,
          description: description.trim(),
          region,
          employment_type: employmentType || null,
          salary: salary.trim() || null,
          contact: contact.trim() || null,
          images,
          status: 'active',
          view_count: 0,
        }),
      });

      console.log('[공고 등록] API 응답 상태:', createResponse.status);

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        const errorMsg = errorData?.error || errorData?.details || '공고 등록에 실패했습니다';
        console.error('[공고 등록] API 실패:', {
          status: createResponse.status,
          error: errorMsg,
          details: errorData?.details,
        });
        throw new Error(errorMsg);
      }

      const createResult = await createResponse.json();
      console.log('[공고 등록] ✓ 성공:', {
        jobId: createResult.jobId,
        message: createResult.message,
      });

      // Success message
      showToast('공고가 등록되었습니다!', 'success');

      // Redirect to jobs page after short delay
      setTimeout(() => {
        router.push('/jobs?category=' + category);
      }, 1000);
    } catch (err: any) {
      const errorMsg = err?.message || err?.error?.message || JSON.stringify(err) || '공고 등록에 실패했습니다.';
      console.error('[공고 등록] 전체 오류:', {
        message: errorMsg,
        status: err?.status,
        statusCode: err?.statusCode,
        fullError: err,
      });
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="bg-bg-primary min-h-screen py-8">
      <Toast />
      <div className="max-w-2xl mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/jobs" className="text-gold hover:text-opacity-80 text-sm font-medium mb-4 inline-block">
            ← 공고 목록으로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            {category === 'recruitment' ? '구인 공고 등록' : '구직 정보 등록'}
          </h1>
          <p className="text-text-secondary">
            {category === 'recruitment'
              ? 'PC방에서 필요한 인재를 모집하세요.'
              : 'PC방에서 일할 준비가 되어 있나요? 당신의 정보를 등록하세요.'}
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-8 bg-bg-secondary p-1 rounded-lg w-fit">
          <button
            onClick={() => setCategory('recruitment')}
            className={`px-4 py-2 rounded font-semibold transition ${
              category === 'recruitment'
                ? 'bg-gold text-bg-primary'
                : 'text-text-secondary hover:text-gold'
            }`}
          >
            📋 구인 공고
          </button>
          <button
            onClick={() => setCategory('job_seeker')}
            className={`px-4 py-2 rounded font-semibold transition ${
              category === 'job_seeker'
                ? 'bg-gold text-bg-primary'
                : 'text-text-secondary hover:text-gold'
            }`}
          >
            👤 구직 정보
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-text-primary font-semibold mb-3">
              이미지 업로드 {imagePreviews.length > 0 && <span className="text-text-muted text-sm font-normal">({imagePreviews.length}개)</span>}
              {imagePreviews.length === 0 && <span className="text-text-muted text-sm font-normal">(선택)</span>}
            </label>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <div className="relative w-full h-32 bg-bg-secondary rounded-lg overflow-hidden">
                      <Image
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-gold text-bg-primary px-2 py-1 rounded text-xs font-semibold">
                          대표
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Area */}
            <div className="bg-bg-secondary border-2 border-dashed border-border-light rounded-lg p-6 text-center hover:border-gold transition">
              <div>
                <p className="text-text-secondary mb-2">이미지를 드래그하거나 클릭하여 업로드하세요</p>
                <p className="text-text-muted text-xs mb-3">최대 5MB, JPG, PNG 형식 지원</p>
                <label className="inline-block px-4 py-2 bg-gold text-bg-primary rounded font-semibold cursor-pointer hover:bg-gold-light transition">
                  파일 선택
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-text-primary font-semibold mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                category === 'recruitment'
                  ? '예: PC방 매니저 모집'
                  : '예: 서울 강남구 PC방 일자리 찾습니다'
              }
              className="w-full px-4 py-2 bg-bg-secondary border border-border-light rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-gold"
              required
            />
          </div>

          {/* Company Name (구인만) */}
          {category === 'recruitment' && (
            <div>
              <label className="block text-text-primary font-semibold mb-2">
                업체명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="예: 강남 PC방"
                className="w-full px-4 py-2 bg-bg-secondary border border-border-light rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-gold"
                required={category === 'recruitment'}
              />
            </div>
          )}

          {/* Region */}
          <div>
            <label className="block text-text-primary font-semibold mb-2">
              지역 <span className="text-red-500">*</span>
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-4 py-2 bg-bg-secondary border border-border-light rounded text-text-primary focus:outline-none focus:border-gold"
              required
            >
              <option value="">지역을 선택하세요</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Employment Type (구인만) */}
          {category === 'recruitment' && (
            <div>
              <label className="block text-text-primary font-semibold mb-2">
                고용형태 <span className="text-text-muted text-sm font-normal">(선택)</span>
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full px-4 py-2 bg-bg-secondary border border-border-light rounded text-text-primary focus:outline-none focus:border-gold"
              >
                <option value="">선택하세요</option>
                {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Salary (구인만) */}
          {category === 'recruitment' && (
            <div>
              <label className="block text-text-primary font-semibold mb-2">
                급여 <span className="text-text-muted text-sm font-normal">(선택)</span>
              </label>
              <input
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="예: 250만원, 시급 12,000원, 협의"
                className="w-full px-4 py-2 bg-bg-secondary border border-border-light rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-gold"
              />
            </div>
          )}

          {/* Contact */}
          <div>
            <label className="block text-text-primary font-semibold mb-2">
              연락처 <span className="text-text-muted text-sm font-normal">(선택)</span>
            </label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="예: 010-1234-5678, email@example.com"
              className="w-full px-4 py-2 bg-bg-secondary border border-border-light rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-gold"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-text-primary font-semibold mb-2">
              상세 설명 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                category === 'recruitment'
                  ? '업무 내용, 근무 조건, 지원 자격 등을 자세히 설명해주세요.'
                  : '자신의 경력, 기술, 근무 조건 등을 자세히 설명해주세요.'
              }
              rows={6}
              className="w-full px-4 py-2 bg-bg-secondary border border-border-light rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-gold resize-none"
              required
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gold text-bg-primary rounded-lg font-semibold hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? '등록 중...' : '공고 등록'}
            </button>
            <Link href="/jobs" className="flex-1">
              <Button variant="secondary" className="w-full">
                취소
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function generateSlug(title: string, region: string): string {
  // Convert to lowercase, remove special characters, replace spaces with hyphens
  const titleSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s가-힣]/g, '') // Keep Korean characters
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);

  const regionSlug = region
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');

  // Add timestamp to ensure uniqueness
  const timestamp = Date.now().toString(36);

  return `${regionSlug}-${titleSlug}-${timestamp}`;
}
