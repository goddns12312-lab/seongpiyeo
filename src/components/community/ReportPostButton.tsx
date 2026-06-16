'use client';

import { ReportButton } from '@/components/community/ReportButton';

export function ReportPostButton({ postId }: { postId: string }) {
  return <ReportButton targetId={postId} type="post" />;
}
