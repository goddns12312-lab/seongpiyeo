'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getSession } from '@/lib/auth-session';
import { Button } from '@/components/ui/Button';
import { REGIONS, PRICE_TYPE_LABELS } from '@/types';
import { createListing, createListingImages, updateListing, deleteListingImages } from '@/lib/actions';
import { getListingPublicPath } from '@/lib/listing-url';

interface ListingFormProps {
  initialData?: any;
  mode?: 'create' | 'edit';
  listingId?: string;
  existingImages?: any[];
}

export function ListingForm({ initialData, mode = 'create', listingId, existingImages = [] }: ListingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [imagesToRemove, setImagesToRemove] = useState<Set<string>>(new Set());
  const [currentExistingImages, setCurrentExistingImages] = useState(existingImages);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    setIsAuthenticated(true);
    setIsCheckingAuth(false);
  }, [router]);

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price_type: initialData?.price_type || 'lease',
    price: initialData?.price ? initialData.price.toString() : '',
    deposit: initialData?.deposit ? initialData.deposit.toString() : '',
    monthly_rent: initialData?.monthly_rent ? initialData.monthly_rent.toString() : '',
    region: initialData?.region || REGIONS[0],
    district: initialData?.district || '',
    address: initialData?.address || '',
    area_sqm: initialData?.area_sqm ? initialData.area_sqm.toString() : '',
    floor: initialData?.floor || '',
    pc_count: initialData?.pc_count ? initialData.pc_count.toString() : '',
    facilities: initialData?.facilities || '',
    available_date_type: initialData?.available_date ? (initialData.available_date === 'immediate' || initialData.available_date === 'negotiable' ? initialData.available_date : 'date') : 'immediate',
    available_date: (initialData?.available_date && initialData.available_date !== 'immediate' && initialData.available_date !== 'negotiable') ? initialData.available_date : '',
    business_license: initialData?.business_license || 'yes',
    administrative_record: initialData?.administrative_record || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;

    setUploadingImages(true);
    setError('');

    try {
      const supabase = createClient();
      const files = Array.from(e.target.files);
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;

        const { data, error } = await supabase.storage
          .from('listings')
          .upload(`images/${fileName}`, file);

        if (error) {
          console.error('업로드 실패:', error);
          setError('이미지 업로드 실패: ' + error.message);
          continue;
        }

        if (data) {
          const { data: urlData } = supabase.storage
            .from('listings')
            .getPublicUrl(`images/${fileName}`);

          uploadedUrls.push(urlData.publicUrl);
        }
      }

      setUploadedImages((prev) => [...prev, ...uploadedUrls]);
      e.target.value = '';
    } catch (err) {
      console.error('Upload error:', err);
      setError('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number, isExisting: boolean = false) => {
    if (isExisting) {
      const imageToRemove = currentExistingImages[index];
      setCurrentExistingImages((prev) => prev.filter((_, i) => i !== index));
      setImagesToRemove((prev) => new Set([...prev, imageToRemove.id]));
    } else {
      setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (loading) return;
    setLoading(true);

    try {
      const session = getSession();
      if (!session) {
        router.push('/login');
        setLoading(false);
        return;
      }

      const listingData = {
        title: formData.title,
        description: formData.description,
        price_type: formData.price_type,
        price: parseInt(formData.monthly_rent) || 0,
        deposit: formData.deposit ? parseInt(formData.deposit) : null,
        monthly_rent: formData.monthly_rent ? parseInt(formData.monthly_rent) : null,
        region: formData.region,
        district: formData.district || null,
        address: formData.address || null,
        area_sqm: formData.area_sqm ? parseInt(formData.area_sqm) : null,
        floor: formData.floor || null,
        pc_count: formData.pc_count ? parseInt(formData.pc_count) : null,
        facilities: formData.facilities || null,
        available_date: formData.available_date_type === 'date' ? formData.available_date : formData.available_date_type,
        business_license: formData.business_license,
        administrative_record: formData.administrative_record || null,
      };

      if (mode === 'edit' && listingId) {
        // 수정 모드
        const updateResult = await updateListing(listingId, listingData);
        if (updateResult.error) {
          setError('매물 수정 실패: ' + updateResult.error);
          setLoading(false);
          return;
        }

        // 삭제할 이미지 처리
        if (imagesToRemove.size > 0) {
          const supabase = createClient();
          for (const imageId of imagesToRemove) {
            await supabase.from('listing_images').delete().eq('id', imageId);
          }
        }

        // 새로운 이미지 추가
        if (uploadedImages.length > 0) {
          const images = uploadedImages.map((url, index) => ({
            listing_id: listingId,
            url,
            is_primary: currentExistingImages.length === 0 && index === 0,
            order_num: currentExistingImages.length + index,
          }));
          await createListingImages(images);
        }

        router.push(getListingPublicPath(formData.region, listingId));
      } else {
        // 생성 모드
        const createResult = await createListing({
          user_id: session.id,
          ...listingData,
          status: 'active',
        });

        if (createResult.error) {
          setError('매물 등록 실패: ' + createResult.error);
          setLoading(false);
          return;
        }

        // 이미지 저장
        if (uploadedImages.length > 0) {
          const images = uploadedImages.map((url, index) => ({
            listing_id: createResult.listingId,
            url,
            is_primary: index === 0,
            order_num: index,
          }));

          await createListingImages(images);
        }

        router.push(getListingPublicPath(formData.region, createResult.listingId));
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError(`매물 ${mode === 'edit' ? '수정' : '등록'} 중 오류가 발생했습니다.`);
      setLoading(false);
    }
  };

  if (isCheckingAuth) {
    return <div className="text-text-secondary text-center py-12">로그인 상태를 확인 중입니다...</div>;
  }

  if (!isAuthenticated) {
    return <div className="text-text-secondary text-center py-12">로그인이 필요합니다</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {error && (
        <div className="bg-red-900/20 border border-red-900 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
        <h2 className="text-text-primary font-semibold text-lg mb-4">기본 정보</h2>

        <div className="space-y-4">
          <div className="bg-bg-tertiary border border-border-light rounded px-4 py-3 mb-4">
            <p className="text-text-secondary text-sm">
              <span className="font-semibold text-gold">매물 유형</span>: 성인 PC방 임차
            </p>
          </div>

          <div>
            <label className="block text-text-primary text-sm font-medium mb-2">제목 *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="예: 강남역 근처 30평 PC방"
              className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
              required
            />
          </div>

          <div>
            <label className="block text-text-primary text-sm font-medium mb-2">설명</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="매물에 대한 상세 설명을 작성하세요."
              rows={4}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-primary text-sm font-medium mb-2">보증금</label>
              <input
                type="number"
                name="deposit"
                value={formData.deposit}
                onChange={handleInputChange}
                placeholder="0"
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-text-primary text-sm font-medium mb-2">월세 *</label>
              <input
                type="number"
                name="monthly_rent"
                value={formData.monthly_rent}
                onChange={handleInputChange}
                placeholder="0"
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
        <h2 className="text-text-primary font-semibold text-lg mb-4">위치</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-primary text-sm font-medium mb-2">시/도 *</label>
              <select
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
              >
                {REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-text-primary text-sm font-medium mb-2">시/구</label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                placeholder="예: 강남구"
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-text-primary text-sm font-medium mb-2">주소</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="상세 주소"
              className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
            />
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
        <h2 className="text-text-primary font-semibold text-lg mb-4">상세 정보 (선택)</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-text-primary text-sm font-medium mb-2">실평수</label>
              <input
                type="number"
                name="area_sqm"
                value={formData.area_sqm}
                onChange={handleInputChange}
                placeholder="평"
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-text-primary text-sm font-medium mb-2">해당층</label>
              <input
                type="text"
                name="floor"
                value={formData.floor}
                onChange={handleInputChange}
                placeholder="예: 2층"
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-text-primary text-sm font-medium mb-2">PC 대수</label>
              <input
                type="number"
                name="pc_count"
                value={formData.pc_count}
                onChange={handleInputChange}
                placeholder="대수"
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-text-primary text-sm font-medium mb-2">시설집기</label>
            <textarea
              name="facilities"
              value={formData.facilities}
              onChange={handleInputChange}
              placeholder="예) PC5대, 에어컨1대, 냉난방기1대, 공기청정기, 냉장고, 정수기"
              rows={2}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
            />
          </div>


          <div>
            <label className="block text-text-primary text-sm font-medium mb-2">입주가능일</label>
            <select
              name="available_date_type"
              value={formData.available_date_type}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold mb-3"
            >
              <option value="immediate">즉시입주</option>
              <option value="negotiable">협의 후 결정</option>
              <option value="date">지정 날짜</option>
            </select>

            {formData.available_date_type === 'date' && (
              <input
                type="date"
                name="available_date"
                value={formData.available_date}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-primary text-sm font-medium mb-2">사업자&영업허가증 여부</label>
              <select
                name="business_license"
                value={formData.business_license}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
              >
                <option value="yes">있음</option>
                <option value="no">없음</option>
              </select>
            </div>

            <div>
              <label className="block text-text-primary text-sm font-medium mb-2">행정처분 이력</label>
              <input
                type="text"
                name="administrative_record"
                value={formData.administrative_record}
                onChange={handleInputChange}
                placeholder="예: 없음"
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
        <h2 className="text-text-primary font-semibold text-lg mb-4">사진</h2>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-border-light rounded-lg p-8 text-center">
            <svg className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-text-secondary mb-3">클릭하거나 파일을 드래그하세요</p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImages}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled={uploadingImages}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('image-upload')?.click();
                }}
              >
                {uploadingImages ? '업로드 중...' : '파일 선택'}
              </Button>
            </label>
          </div>

          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedImages.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Listing ${index + 1}`}
                    className="w-full h-32 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Existing Images */}
      {mode === 'edit' && currentExistingImages.length > 0 && (
        <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
          <h2 className="text-text-primary font-semibold text-lg mb-4">기존 사진</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {currentExistingImages.map((image, index) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.url}
                  alt={`Existing ${index + 1}`}
                  className="w-full h-32 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index, true)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3">
        <Button variant="primary" size="lg" isLoading={loading} className="flex-1">
          {mode === 'edit' ? '수정 완료' : '매물 등록'}
        </Button>
      </div>
    </form>
  );
}
