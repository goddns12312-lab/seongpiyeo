import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SecondhandEditClient from './secondhand-edit-client';

const REGIONS = ['서울', '경기', '인천', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SecondhandEditPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // 현재 로그인한 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();

  // 중고물품 조회
  const { data: items, error } = await supabase
    .from('secondhand_items')
    .select('id, title, description, price, region, user_id, status, main_image_url, created_at')
    .eq('id', id)
    .limit(1);

  const item = items?.[0];

  if (error || !item) {
    notFound();
  }

  // 삭제된 물품은 수정 불가
  if (item.status === 'deleted') {
    notFound();
  }

  // 권한 확인
  if (!user) {
    redirect(`/login?redirect=/secondhand/${id}/edit`);
  }

  // 로그인한 사용자의 권한 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';
  const isAuthor = item.user_id === user.id;
  const isNullOwner = item.user_id === null;

  // user_id가 NULL이면 관리자만 수정 가능
  if (isNullOwner && !isAdmin) {
    notFound();
  }

  // user_id가 있으면 관리자 또는 작성자만
  if (!isNullOwner && !isAdmin && !isAuthor) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-bg-primary py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-text-primary mb-8">중고물품 수정</h1>
        <SecondhandEditClient itemId={id} initialData={item} regions={REGIONS} />
      </div>
    </div>
  );
}
