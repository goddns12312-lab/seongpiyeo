'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getSession } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { REGIONS } from '@/types';
import { createListing, createListingImages, updateListing, deleteListingImages } from '@/lib/actions';
import { buildListingSeoTitle, buildListingSeoDescription, buildListingImageAlt } from '@/lib/seo-metadata';

interface ListingFormNewProps {
  initialData?: any;
  mode?: 'create' | 'edit';
  listingId?: string;
  existingImages?: any[];
}

const STRENGTH_EMOJIS = [
  { emoji: '🍜', label: '먹고자고가능' },
  { emoji: '🛏', label: '침대있음' },
  { emoji: '🚻', label: '내부화장실' },
  { emoji: '🍳', label: '주방있음' },
  { emoji: '🏪', label: '편의점근처' },
  { emoji: '🅿️', label: '주차가능' },
  { emoji: '🔥', label: '위치좋아요' },
  { emoji: '💵', label: '매출좋음' },
  { emoji: '🏢', label: '부동산매물' },
  { emoji: '💃', label: '유흥가' },
  { emoji: '💰', label: '조정가능' },
  { emoji: '⚡️', label: '급매' },
];

const DISTRICT_MAP: Record<string, string[]> = {
  '서울': ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
  '부산': ['강서구', '금정구', '남구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구'],
  '대구': ['남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구'],
  '인천': ['강화군', '계양구', '남동구', '동구', '미추홀구', '부평구', '서구', '연수구', '중구'],
  '광주': ['광산구', '남구', '동구', '북구', '서구'],
  '대전': ['대덕구', '동구', '서구', '유성구', '중구'],
  '울산': ['남구', '동구', '북구', '울주군', '중구'],
  '경기도': ['가평군', '고양시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시', '남양주시', '동두천시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시', '안양시', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시', '의왕시', '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시'],
  '강원도': ['강릉시', '고성군', '동해시', '삼척시', '속초시', '양구군', '양양군', '영월군', '원주시', '인제군', '정선군', '철원군', '춘천시', '태백시', '평창군', '홍천군', '화천군', '횡성군'],
  '충청북도': ['괴산군', '단양군', '보은군', '영동군', '옥천군', '음성군', '제천시', '증평군', '진천군', '청주시', '충주시'],
  '충청남도': ['계룡시', '공주시', '금산군', '논산시', '당진시', '보령시', '부여군', '서산시', '서천군', '아산시', '예산군', '천안시', '청양군', '태안군', '홍성군'],
  '전라북도': ['고창군', '군산시', '김제시', '남원시', '무주군', '부안군', '순창군', '완주군', '익산시', '임실군', '장수군', '전주시', '정읍시', '진안군'],
  '전라남도': ['강진군', '고흥군', '곡성군', '광양시', '구례군', '나주시', '담양군', '동구', '목포시', '무안군', '보성군', '봉화군', '순천시', '신안군', '여수시', '영광군', '영순군', '완도군', '장성군', '장흥군', '진도군', '함평군', '해남군'],
  '경상북도': ['경산시', '경주시', '고령군', '구미시', '군위군', '김천시', '문경시', '봉화군', '상주시', '성주군', '안동시', '영덕군', '영양군', '영주시', '영천시', '예천군', '울릉군', '울진군', '의성군', '청도군', '청송군', '칠곡군', '포항시'],
  '경상남도': ['거제시', '거창군', '고성군', '김해시', '남해군', '밀양시', '사천시', '산청군', '서귀포시', '양산시', '의령군', '진주시', '창녕군', '창원시', '통영시', '하동군', '함안군', '함양군', '합천군'],
  '제주도': ['서귀포시', '제주시'],
};

export function ListingFormNew({ initialData, mode = 'create', listingId, existingImages = [] }: ListingFormNewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentExistingImages, setCurrentExistingImages] = useState(existingImages);
  const [imagesToRemove, setImagesToRemove] = useState<Set<string>>(new Set());
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const defaultTemplate = `1. 매물업종: 성인PC방
2. 매물위치:
3. 실평수:
4. 해당층:
5. 보증금:
6. 희망권리금:
7. 월세:
8. 시설집기: 예) PC6대, 에어컨1대, 냉난방기1대, 공기청정기2대, 냉장고2대, 정수기, 안마기, 리클라이너쇼파
9. 입주가능일:
10. 사업자&영업허가증 여부:
11. 행정처분여부(단속이력):
12. 연락처: `;

  const [formData, setFormData] = useState({
    title: '',
    region: REGIONS[0],
    district: '',
    address: '',
    royalty: '',
    deposit: '',
    monthly_rent: '',
    area_sqm: '',
    pc_count: '',
    floor: '',
    available_date: '즉시',
    business_license: false,
    administrative_record: false,
    phone: '',
    facilities: '',
    description: defaultTemplate,
    strengths: [] as string[],
    features: '', // 특징/장점 필드 추가
  });

  useEffect(() => {
    console.log('[ListingFormNew useEffect] 초기 세션 확인 시작');
    console.log('[ListingFormNew useEffect] 1. localStorage pc_bang_session:', localStorage.getItem('pc_bang_session') || 'null');

    const session = getSession();
    console.log('[ListingFormNew useEffect] 2. getSession() 결과:', {
      sessionExists: !!session,
      sessionId: session?.id || 'null',
      sessionUsername: session?.username || 'null',
    });

    if (!session) {
      console.log('[ListingFormNew useEffect] 3. 세션 없음 - /login으로 리다이렉트');
      router.push('/login');
      return;
    }
    console.log('[ListingFormNew useEffect] 3-1. 세션 있음 - 진행');
    setIsAuthenticated(true);
    setIsCheckingAuth(false);

    if (initialData) {
      setFormData({
        title: initialData?.title || '',
        region: initialData?.region || REGIONS[0],
        district: initialData?.district || '',
        address: initialData?.address || '',
        royalty: initialData?.premium_price ? initialData.premium_price.toString() : '',
        deposit: initialData?.deposit ? initialData.deposit.toString() : '',
        monthly_rent: initialData?.monthly_rent ? initialData.monthly_rent.toString() : '',
        area_sqm: initialData?.area_sqm ? initialData.area_sqm.toString() : '',
        pc_count: initialData?.pc_count ? initialData.pc_count.toString() : '',
        floor: initialData?.floor || '',
        available_date: initialData?.available_date || '즉시',
        business_license: initialData?.business_license === 'yes' ? true : false,
        administrative_record: initialData?.administrative_record === '있음' ? true : false,
        phone: initialData?.phone || '',
        facilities: initialData?.facilities || '',
        description: initialData?.description || '',
        features: initialData?.features || '',
        strengths: (initialData?.facilities ? initialData.facilities.split(',').filter((s: string) => {
          const trimmed = s.trim();
          return STRENGTH_EMOJIS.some(item => item.emoji === trimmed);
        }) : []) as string[],
      });
    }
  }, [router, initialData]);

  // 실시간 필드 검증
  const validateField = (name: string, value: string) => {
    const errors = { ...validationErrors };

    if (name === 'title' && value.trim().length > 0 && value.trim().length < 10) {
      errors.title = '제목은 최소 10자 이상이어야 합니다.';
    } else {
      delete errors.title;
    }

    if (name === 'district' && value.trim() === '' && mode === 'create') {
      errors.district = '시/군/구는 필수 입력입니다.';
    } else if (name === 'district') {
      delete errors.district;
    }

    if (name === 'description' && value.trim().length > 0 && value.trim().length < 50) {
      errors.description = '상세설명은 최소 50자 이상이어야 합니다.';
    } else {
      delete errors.description;
    }

    if (name === 'features' && value.trim().length > 0 && value.trim().length < 30) {
      errors.features = '특징/장점은 최소 30자 이상이어야 합니다.';
    } else {
      delete errors.features;
    }

    setValidationErrors(errors);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));

    // 실시간 검증
    if (['title', 'district', 'description', 'features'].includes(name)) {
      validateField(name, value);
    }
  };

  // Region 변경 시 district 초기화
  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRegion = e.target.value;
    setFormData((prev) => ({
      ...prev,
      region: newRegion,
      district: '',
    }));
    // district 오류 제거
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.district;
      return newErrors;
    });
  };

  const handleStrengthToggle = (emoji: string) => {
    setFormData((prev) => ({
      ...prev,
      strengths: prev.strengths.includes(emoji)
        ? prev.strengths.filter((s) => s !== emoji)
        : [...prev.strengths, emoji],
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;
    const totalImages = uploadedImages.length + currentExistingImages.length;
    if (totalImages >= 10) {
      setError('사진은 최대 10개까지만 업로드 가능합니다.');
      return;
    }

    const remainingSlots = 10 - totalImages;
    const filesToUpload = Array.from(e.target.files).slice(0, remainingSlots);

    setUploadingImages(true);
    setError('');

    try {
      const supabase = createClient();
      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;

        const { data, error } = await supabase.storage
          .from('listings')
          .upload(`images/${fileName}`, file);

        if (error) {
          console.error('Upload error:', error);
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

    // 필수 필드 검증
    const newErrors: Record<string, string> = {};

    if (!formData.title || formData.title.trim().length < 10) {
      newErrors.title = '제목은 최소 10자 이상 입력해주세요.';
    }

    if (!formData.region) {
      newErrors.region = '시/도를 선택해주세요.';
    }

    if (!formData.district || formData.district.trim() === '') {
      newErrors.district = '시/군/구는 필수 입력입니다.';
    }

    if (!formData.description || formData.description.trim().length < 50) {
      newErrors.description = '상세설명은 최소 50자 이상 입력해주세요.';
    }

    if (!formData.features || formData.features.trim().length < 30) {
      newErrors.features = '특징/장점은 최소 30자 이상 입력해주세요.';
    }

    if (!formData.phone) {
      newErrors.phone = '연락처를 입력해주세요.';
    }

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      setError('필수 필드를 확인해주세요.');
      return;
    }

    const totalImages = uploadedImages.length + currentExistingImages.length;
    if (mode === 'create' && totalImages === 0) {
      setError('사진을 1장 이상 등록해주세요.');
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      const session = getSession();
      console.log('[ListingFormNew handleSubmit] 1. getSession() 결과:', {
        sessionExists: !!session,
        sessionId: session?.id || 'null',
        sessionAll: session,
      });
      if (!session) {
        router.push('/login');
        setLoading(false);
        return;
      }

      const facilitiesText = formData.strengths.join(',');

      // SEO 자동 생성
      const seoTitle = buildListingSeoTitle({
        region: formData.region,
        district: formData.district,
        title: formData.title,
        premium_price: formData.royalty ? parseInt(formData.royalty) : null,
        monthly_rent: formData.monthly_rent ? parseInt(formData.monthly_rent) : null,
      });

      const seoDescription = buildListingSeoDescription({
        region: formData.region,
        district: formData.district,
        location: formData.address,
        premium_price: formData.royalty ? parseInt(formData.royalty) : null,
        deposit: formData.deposit ? parseInt(formData.deposit) : null,
        monthly_rent: formData.monthly_rent ? parseInt(formData.monthly_rent) : null,
        area_sqm: formData.area_sqm ? parseInt(formData.area_sqm) : null,
        pc_count: formData.pc_count ? parseInt(formData.pc_count) : null,
      });

      const listingData = {
        title: seoTitle, // SEO 제목 사용
        description: formData.description,
        region: formData.region,
        district: formData.district,
        address: formData.address || null,
        premium_price: formData.royalty ? parseInt(formData.royalty) : null,
        deposit: formData.deposit ? parseInt(formData.deposit) : null,
        monthly_rent: formData.monthly_rent ? parseInt(formData.monthly_rent) : null,
        area_sqm: formData.area_sqm ? parseInt(formData.area_sqm) : null,
        pc_count: formData.pc_count ? parseInt(formData.pc_count) : null,
        floor: formData.floor || null,
        available_date: formData.available_date,
        business_license: formData.business_license ? 'yes' : 'no',
        administrative_record: formData.administrative_record ? '있음' : '없음',
        facilities: facilitiesText || null,
        features: formData.features,
      };

      if (mode === 'edit' && listingId) {
        const updateResult = await updateListing(listingId, listingData);
        if (updateResult.error) {
          setError('매물 수정 실패: ' + updateResult.error);
          setLoading(false);
          return;
        }

        if (imagesToRemove.size > 0) {
          const supabase = createClient();
          for (const imageId of imagesToRemove) {
            await supabase.from('listing_images').delete().eq('id', imageId);
          }
        }

        if (uploadedImages.length > 0) {
          const images = uploadedImages.map((url, index) => ({
            listing_id: listingId,
            url,
            is_primary: currentExistingImages.length === 0 && index === 0,
            order_num: currentExistingImages.length + index,
            alt: buildListingImageAlt({ region: formData.region, district: formData.district, premium_price: formData.royalty ? parseInt(formData.royalty) : null, area_sqm: formData.area_sqm ? parseInt(formData.area_sqm) : null }),
          }));
          await createListingImages(images);
        }

        router.push(`/listings/${listingId}`);
      } else {
        // 신규 등록: status = 'active'
        const dataToSend = {
          user_id: session.id,
          ...listingData,
          price_type: 'lease',
          price: parseInt(formData.monthly_rent || '0'),
          status: 'active',
          main_image_url: uploadedImages.length > 0 ? uploadedImages[0] : null,
          thumbnail_url: uploadedImages.length > 0 ? uploadedImages[0] : null,
        };
        console.log('[ListingFormNew handleSubmit] 2. dataToSend keys:', Object.keys(dataToSend));
        console.log('[ListingFormNew handleSubmit] 2. dataToSend 전체:', JSON.stringify(dataToSend, null, 2));
        console.log('[ListingFormNew handleSubmit] 2. createListing 호출 데이터:', {
          user_id: dataToSend.user_id,
          title: dataToSend.title,
          keys: Object.keys(dataToSend),
        });
        const createResult = await createListing(dataToSend);

        if (createResult.error) {
          setError('매물 등록 실패: ' + createResult.error);
          setLoading(false);
          return;
        }

        if (uploadedImages.length > 0) {
          const images = uploadedImages.map((url, index) => ({
            listing_id: createResult.listingId,
            url,
            is_primary: index === 0,
            order_num: index,
            alt: buildListingImageAlt({ region: formData.region, district: formData.district, premium_price: formData.royalty ? parseInt(formData.royalty) : null, area_sqm: formData.area_sqm ? parseInt(formData.area_sqm) : null }),
          }));
          await createListingImages(images);
        }

        router.push(`/listings/${createResult.listingId}`);
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

  const totalImages = uploadedImages.length + currentExistingImages.length;
  const availableDistricts = DISTRICT_MAP[formData.region] || [];

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {error && (
        <div className="bg-red-900/20 border border-red-900 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* 사진 섹션 */}
      <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-text-primary font-semibold text-lg">사진 *</h2>
          <span className="text-text-secondary text-sm">({totalImages}/10)</span>
        </div>

        {totalImages < 10 && (
          <div className="border-2 border-dashed border-border-light rounded-lg p-8 text-center mb-4">
            <svg className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImages || totalImages >= 10}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled={uploadingImages || totalImages >= 10}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('image-upload')?.click();
                }}
              >
                {uploadingImages ? '업로드 중...' : '사진 추가'}
              </Button>
            </label>
          </div>
        )}

        {currentExistingImages.length > 0 && (
          <div className="mb-4">
            <p className="text-text-secondary text-xs mb-2">기존 사진</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {currentExistingImages.map((image, index) => (
                <div key={image.id} className="relative group">
                  <img src={image.url} alt={`Existing ${index + 1}`} className="w-full h-20 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => removeImage(index, true)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploadedImages.length > 0 && (
          <div>
            <p className="text-text-secondary text-xs mb-2">새로운 사진</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {uploadedImages.map((url, index) => (
                <div key={index} className="relative group">
                  <img src={url} alt={`New ${index + 1}`} className="w-full h-20 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => removeImage(index, false)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalImages === 0 && mode === 'create' && (
          <p className="text-red-400 text-sm">📸 사진은 필수입니다. 1장 이상 등록해주세요.</p>
        )}
      </div>

      {/* 제목 */}
      <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
        <label className="block text-text-primary text-sm font-medium mb-2">제목 *</label>
        <p className="text-text-secondary text-xs mb-2">최소 10자 이상 입력하세요. SEO 최적화 제목이 자동으로 생성됩니다.</p>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="예: 강남역 근처 30평 PC방"
          minLength={10}
          className={`w-full px-4 py-2 bg-bg-tertiary border text-text-primary rounded focus:outline-none focus:border-gold ${
            validationErrors.title ? 'border-red-500' : 'border-border-light'
          }`}
        />
        {validationErrors.title && <p className="text-red-400 text-sm mt-1">{validationErrors.title}</p>}
        <div className="text-text-secondary text-xs mt-2">{formData.title.length}/100 (최소 10자)</div>

        {/* SEO 미리보기 */}
        {formData.title && formData.region && formData.district && (
          <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-3 mt-3">
            <p className="text-blue-300 text-xs font-semibold mb-1">SEO 제목 미리보기</p>
            <p className="text-text-primary text-sm">
              {buildListingSeoTitle({
                region: formData.region,
                district: formData.district,
                title: formData.title,
                premium_price: formData.royalty ? parseInt(formData.royalty) : null,
                monthly_rent: formData.monthly_rent ? parseInt(formData.monthly_rent) : null,
              })}
            </p>
          </div>
        )}
      </div>

      {/* 지역 */}
      <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
        <h3 className="text-text-primary font-semibold text-sm mb-4">지역 *</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-text-secondary text-xs mb-2">시/도</label>
            <select
              name="region"
              value={formData.region}
              onChange={handleRegionChange}
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
            <label className="block text-text-secondary text-xs mb-2">시/군/구 *</label>
            <select
              name="district"
              value={formData.district}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 bg-bg-tertiary border text-text-primary rounded focus:outline-none focus:border-gold ${
                validationErrors.district ? 'border-red-500' : 'border-border-light'
              }`}
            >
              <option value="">선택하세요</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {validationErrors.district && <p className="text-red-400 text-sm mt-1">{validationErrors.district}</p>}
          </div>
        </div>
      </div>

      {/* 가격 정보 */}
      <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
        <h3 className="text-text-primary font-semibold text-sm mb-4">가격 정보</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-text-secondary text-xs mb-2">권리금</label>
            <div className="flex gap-2">
              <input
                type="number"
                name="royalty"
                value={formData.royalty}
                onChange={handleInputChange}
                placeholder="0"
                className="flex-1 px-3 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
              />
              <span className="flex items-center text-text-secondary text-sm">만원</span>
            </div>
          </div>
          <div>
            <label className="block text-text-secondary text-xs mb-2">보증금</label>
            <div className="flex gap-2">
              <input
                type="number"
                name="deposit"
                value={formData.deposit}
                onChange={handleInputChange}
                placeholder="0"
                className="flex-1 px-3 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
              />
              <span className="flex items-center text-text-secondary text-sm">만원</span>
            </div>
          </div>
          <div>
            <label className="block text-text-secondary text-xs mb-2">월세</label>
            <div className="flex gap-2">
              <input
                type="number"
                name="monthly_rent"
                value={formData.monthly_rent}
                onChange={handleInputChange}
                placeholder="0"
                className="flex-1 px-3 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
              />
              <span className="flex items-center text-text-secondary text-sm">만원</span>
            </div>
          </div>
        </div>
      </div>

      {/* 상세 정보 */}
      <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
        <h3 className="text-text-primary font-semibold text-sm mb-4">상세 정보</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-text-secondary text-xs mb-2">평수</label>
            <div className="flex gap-2">
              <input
                type="number"
                name="area_sqm"
                value={formData.area_sqm}
                onChange={handleInputChange}
                placeholder="0"
                className="flex-1 px-3 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
              />
              <span className="flex items-center text-text-secondary text-sm">평</span>
            </div>
          </div>
          <div>
            <label className="block text-text-secondary text-xs mb-2">PC 대수</label>
            <div className="flex gap-2">
              <input
                type="number"
                name="pc_count"
                value={formData.pc_count}
                onChange={handleInputChange}
                placeholder="0"
                className="flex-1 px-3 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
              />
              <span className="flex items-center text-text-secondary text-sm">대</span>
            </div>
          </div>
          <div>
            <label className="block text-text-secondary text-xs mb-2">층수</label>
            <input
              type="text"
              name="floor"
              value={formData.floor}
              onChange={handleInputChange}
              placeholder="예: 1층, B1"
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
            />
          </div>
        </div>

        <div>
          <label className="block text-text-secondary text-xs mb-2">입주가능일</label>
          <input
            type="text"
            name="available_date"
            value={formData.available_date}
            onChange={handleInputChange}
            placeholder="예: 즉시, 협의"
            className="w-full px-3 py-2 bg-bg-tertiary border border-border-light text-text-primary rounded focus:outline-none focus:border-gold"
          />
        </div>
      </div>

      {/* 특징/장점 */}
      <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
        <label className="block text-text-primary text-sm font-medium mb-2">특징/장점 *</label>
        <p className="text-text-secondary text-xs mb-2">매물의 주요 특징과 장점을 설명해주세요. (최소 30자)</p>
        <textarea
          name="features"
          value={formData.features}
          onChange={handleInputChange}
          placeholder="예: 최근 인테리어로 쾌적한 환경, 고객층 안정적, 상권 우수, 주차 가능"
          rows={3}
          maxLength={200}
          className={`w-full px-4 py-2 bg-bg-tertiary border text-text-primary text-sm rounded focus:outline-none focus:border-gold ${
            validationErrors.features ? 'border-red-500' : 'border-border-light'
          }`}
        />
        {validationErrors.features && <p className="text-red-400 text-sm mt-1">{validationErrors.features}</p>}
        <div className="text-text-secondary text-xs mt-2 text-right">{formData.features.length}/200 (최소 30자)</div>
      </div>

      {/* 매물강점 */}
      <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
        <label className="block text-text-primary text-sm font-medium mb-4">매물강점 (선택)</label>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {STRENGTH_EMOJIS.map(({ emoji, label }) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleStrengthToggle(emoji)}
              className={`p-3 rounded border-2 transition text-center ${
                formData.strengths.includes(emoji)
                  ? 'border-gold bg-gold/10'
                  : 'border-border-light bg-bg-tertiary'
              }`}
              title={label}
            >
              <div className="text-2xl">{emoji}</div>
              <div className="text-text-secondary text-xs mt-1">{label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 사업 정보 */}
      <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
        <h3 className="text-text-primary font-semibold text-sm mb-4">사업 정보</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-text-secondary text-xs mb-3">허가여부</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="business_license_radio"
                  checked={formData.business_license === true}
                  onChange={() => setFormData((prev) => ({ ...prev, business_license: true }))}
                  className="w-4 h-4"
                />
                <span className="text-text-primary text-sm">허가</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="business_license_radio"
                  checked={formData.business_license === false}
                  onChange={() => setFormData((prev) => ({ ...prev, business_license: false }))}
                  className="w-4 h-4"
                />
                <span className="text-text-primary text-sm">미허가/모름</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-text-secondary text-xs mb-3">행정처분여부</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="administrative_radio"
                  checked={formData.administrative_record === true}
                  onChange={() => setFormData((prev) => ({ ...prev, administrative_record: true }))}
                  className="w-4 h-4"
                />
                <span className="text-text-primary text-sm">있음</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="administrative_radio"
                  checked={formData.administrative_record === false}
                  onChange={() => setFormData((prev) => ({ ...prev, administrative_record: false }))}
                  className="w-4 h-4"
                />
                <span className="text-text-primary text-sm">없음/모름</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 연락처 */}
      <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
        <label className="block text-text-primary text-sm font-medium mb-2">연락처 *</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          placeholder="010-0000-0000"
          className={`w-full px-4 py-2 bg-bg-tertiary border text-text-primary rounded focus:outline-none focus:border-gold ${
            validationErrors.phone ? 'border-red-500' : 'border-border-light'
          }`}
          required
        />
        {validationErrors.phone && <p className="text-red-400 text-sm mt-1">{validationErrors.phone}</p>}
      </div>

      {/* 상세설명 */}
      <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
        <label className="block text-text-primary text-sm font-medium mb-2">상세설명 *</label>
        <p className="text-text-secondary text-xs mb-2">최소 50자 이상 입력하세요. 기본 양식이 자동으로 제공됩니다.</p>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={12}
          maxLength={1000}
          className={`w-full px-4 py-2 bg-bg-tertiary border text-text-primary text-sm rounded focus:outline-none focus:border-gold resize-none font-mono ${
            validationErrors.description ? 'border-red-500' : 'border-border-light'
          }`}
        />
        {validationErrors.description && <p className="text-red-400 text-sm mt-1">{validationErrors.description}</p>}
        <div className="text-text-secondary text-xs mt-2 text-right">{formData.description.length}/1000 (최소 50자)</div>
      </div>

      {/* 제출 버튼 */}
      <div>
        <Button
          variant="primary"
          size="lg"
          isLoading={loading}
          disabled={totalImages === 0 || Object.keys(validationErrors).length > 0}
          className="w-full"
        >
          {mode === 'edit' ? '수정 완료' : '매물 등록'}
        </Button>
        {Object.keys(validationErrors).length > 0 && (
          <p className="text-red-400 text-sm mt-2 text-center">
            ⚠️ 필수 필드를 모두 입력해주세요.
          </p>
        )}
      </div>
    </form>
  );
}
