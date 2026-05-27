'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { REGIONS, EMPLOYMENT_TYPE_LABELS } from '@/types';

interface JobFiltersProps {
  selectedRegion?: string;
  selectedTypes: string[];
  searchQuery?: string;
}

export function JobFilters({ selectedRegion = '', selectedTypes = [], searchQuery = '' }: JobFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const region = e.target.value;
    const params = new URLSearchParams(searchParams);

    if (region) {
      params.set('region', region);
    } else {
      params.delete('region');
    }
    params.delete('page');

    router.push(`/jobs?${params.toString()}`);
  };

  const handleTypeToggle = (type: string) => {
    const params = new URLSearchParams(searchParams);
    const types = params.getAll('employment_type') || [];

    if (types.includes(type)) {
      params.delete('employment_type');
      types.filter(t => t !== type).forEach(t => params.append('employment_type', t));
    } else {
      params.append('employment_type', type);
    }
    params.delete('page');

    router.push(`/jobs?${params.toString()}`);
  };

  const handleSearchChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search') as string;
    const params = new URLSearchParams(searchParams);

    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    params.delete('page');

    router.push(`/jobs?${params.toString()}`);
  };

  const handleClearFilters = () => {
    router.push('/jobs');
  };

  return (
    <div className="bg-bg-secondary border border-border-light rounded-lg p-4 lg:p-6 space-y-4">
      {/* Search */}
      <form onSubmit={handleSearchChange} className="flex gap-2">
        <input
          type="text"
          name="search"
          defaultValue={searchQuery}
          placeholder="공고 검색 (제목, 회사, 설명)..."
          className="flex-1 px-4 py-2 bg-bg-tertiary border border-border-light rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-gold text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gold text-bg-primary rounded font-semibold hover:bg-gold-light transition text-sm whitespace-nowrap"
        >
          검색
        </button>
      </form>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Region Filter */}
        <div>
          <label className="block text-text-secondary text-sm font-semibold mb-2">지역</label>
          <select
            value={selectedRegion}
            onChange={handleRegionChange}
            className="w-full px-4 py-2 bg-bg-tertiary border border-border-light rounded text-text-primary focus:outline-none focus:border-gold text-sm"
          >
            <option value="">전체 지역</option>
            {REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        {/* Employment Type Filter */}
        <div>
          <label className="block text-text-secondary text-sm font-semibold mb-2">고용형태</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleTypeToggle(key)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                  selectedTypes.includes(key)
                    ? 'bg-gold text-bg-primary'
                    : 'bg-bg-tertiary text-text-secondary border border-border-light hover:border-gold'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clear Filters Button */}
      {(selectedRegion || selectedTypes.length > 0 || searchQuery) && (
        <button
          onClick={handleClearFilters}
          className="w-full px-4 py-2 bg-bg-tertiary text-text-secondary rounded hover:bg-border-light transition text-sm font-medium"
        >
          필터 초기화
        </button>
      )}
    </div>
  );
}
