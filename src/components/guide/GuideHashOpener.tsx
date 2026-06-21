'use client';

import { useEffect } from 'react';

/** /guide#transfer 등 앵커 진입 시 해당 details 자동 펼침 */
export function GuideHashOpener() {
  useEffect(() => {
    const openFromHash = () => {
      const id = window.location.hash.replace('#', '');
      if (!id) return;
      const el = document.getElementById(id);
      if (el instanceof HTMLDetailsElement) {
        el.open = true;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, []);

  return null;
}
