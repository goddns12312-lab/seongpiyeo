import Link from 'next/link';
import Image from 'next/image';
import { memo } from 'react';
import { getOptimizedImageUrl } from '@/lib/image-url';
import { Job } from '@/types';
import { EMPLOYMENT_TYPE_LABELS } from '@/types';

interface JobCardProps {
  job: Job;
}

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="240"%3E%3Crect width="400" height="240" fill="%23222222"/%3E%3Ctext x="50%25" y="50%25" font-size="16" fill="%23888888" text-anchor="middle" dominant-baseline="middle"%3EPC방 공고 이미지%3C/text%3E%3C/svg%3E';

function getPrimaryImage(job: Job): string | null {
  if (!job.images || job.images.length === 0) return null;
  const primary = job.images.find((img) => img.is_primary);
  return primary?.url || job.images[0]?.url || null;
}

function JobCardComponent({ job }: JobCardProps) {
  const isRecruitement = job.category === 'recruitment';
  const relativeTime = getRelativeTime(new Date(job.created_at));

  const imageUrl = getPrimaryImage(job);
  const imageSrc = imageUrl ? getOptimizedImageUrl(imageUrl, 400, 75) : PLACEHOLDER_IMAGE;

  const href = job.slug ? `/jobs/${job.slug}` : `/jobs/${job.id}`;

  return (
    <Link href={href}>
      <div className="bg-bg-secondary border border-border-light rounded-lg overflow-hidden hover:border-gold hover:shadow-lg transition-all duration-300 h-full cursor-pointer">
        {/* Image Section */}
        <div className="relative w-full h-40 bg-bg-tertiary overflow-hidden">
          <Image
            src={imageSrc}
            alt={job.title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {isRecruitement ? (
            <div className="absolute top-3 left-3 bg-gold/90 text-bg-primary px-3 py-1 rounded-full text-xs font-semibold">
              구인
            </div>
          ) : (
            <div className="absolute top-3 left-3 bg-blue-500/90 text-white px-3 py-1 rounded-full text-xs font-semibold">
              구직
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 flex flex-col gap-3">
          {/* Title */}
          <h3 className="text-text-primary font-semibold text-base line-clamp-2 group-hover:text-gold-dark dark:group-hover:text-gold transition-colors">
            {job.title}
          </h3>

          {/* Company Name (구인만) */}
          {isRecruitement && job.company_name && (
            <p className="text-text-secondary text-sm font-medium">
              {job.company_name}
            </p>
          )}

          {/* Region & Employment Type */}
          <div className="flex gap-2 flex-wrap">
            <span className="bg-bg-tertiary text-text-secondary px-2.5 py-1 rounded text-xs">
              {job.region}
            </span>
            {job.employment_type && (
              <span className="bg-gold/10 text-gold-dark dark:text-gold px-2.5 py-1 rounded text-xs font-semibold">
                {EMPLOYMENT_TYPE_LABELS[job.employment_type] || job.employment_type}
              </span>
            )}
          </div>

          {/* Salary */}
          {job.salary && (
            <p className="text-gold-dark dark:text-gold font-bold text-sm">
              {job.salary}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex justify-between items-center text-text-muted text-xs pt-2 border-t border-border-light">
            <span>{relativeTime}</span>
            <span>조회 {job.view_count}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export const JobCard = memo(JobCardComponent);

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString('ko-KR');
}
