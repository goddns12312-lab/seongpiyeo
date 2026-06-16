'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSession } from '@/lib/auth-session';
import { formatDateTime } from '@/lib/utils';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [user, setUser] = useState<{ id: string } | null>(null);

  const load = () => {
    fetch('/api/notifications', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setItems(d.notifications || []);
          setUnread(d.unreadCount || 0);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    const session = getSession();
    setUser(session);
    if (session) load();
    const interval = session ? setInterval(load, 60000) : undefined;
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ markAllRead: true }),
    });
    load();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 text-text-secondary hover:text-gold transition"
        aria-label="알림"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-bg-secondary border border-border-light rounded-lg shadow-xl z-50">
            <div className="flex items-center justify-between p-3 border-b border-border-light">
              <span className="font-semibold text-text-primary text-sm">알림</span>
              {unread > 0 && (
                <button type="button" onClick={markAllRead} className="text-xs text-gold">
                  모두 읽음
                </button>
              )}
            </div>
            {items.length === 0 ? (
              <p className="p-4 text-text-muted text-sm text-center">알림이 없습니다</p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={n.link_url || '/community'}
                  onClick={() => setOpen(false)}
                  className={`block p-3 border-b border-border-light hover:bg-bg-tertiary ${
                    !n.is_read ? 'bg-gold/5' : ''
                  }`}
                >
                  <p className="text-sm text-text-primary font-medium">{n.title}</p>
                  {n.body && <p className="text-xs text-text-muted mt-1 line-clamp-2">{n.body}</p>}
                  <p className="text-[10px] text-text-muted mt-1">{formatDateTime(n.created_at)}</p>
                </Link>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
