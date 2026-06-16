'use client';

import { useState, useEffect } from 'react';

interface PostEditorProps {
  name?: string;
  defaultValue?: string;
  rows?: number;
  placeholder?: string;
  storageKey?: string;
}

export function PostEditor({
  name = 'content',
  defaultValue = '',
  rows = 12,
  placeholder = '게시글 내용을 입력하세요',
  storageKey,
}: PostEditorProps) {
  const [content, setContent] = useState(defaultValue);
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  useEffect(() => {
    if (!storageKey) return;
    const saved = localStorage.getItem(storageKey);
    if (saved && !defaultValue) setContent(saved);
  }, [storageKey, defaultValue]);

  useEffect(() => {
    if (!storageKey) return;
    const t = setTimeout(() => localStorage.setItem(storageKey, content), 500);
    return () => clearTimeout(t);
  }, [content, storageKey]);

  const insert = (before: string, after = '') => {
    const ta = document.getElementById(`editor-${name}`) as HTMLTextAreaElement | null;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);
    const next = content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(next);
  };

  const previewHtml = content.split('\n').map((line, idx) => {
    if (line.startsWith('## ')) {
      return (
        <h3 key={idx} className="text-lg font-bold text-text-primary mt-4 mb-2">
          {line.replace('## ', '')}
        </h3>
      );
    }
    if (line.startsWith('- ')) {
      return (
        <li key={idx} className="ml-4 my-1">
          {line.replace('- ', '')}
        </li>
      );
    }
    if (line.startsWith('**') && line.endsWith('**')) {
      return (
        <p key={idx} className="font-semibold text-text-primary my-1">
          {line.slice(2, -2)}
        </p>
      );
    }
    return line ? <p key={idx} className="my-1">{line}</p> : <br key={idx} />;
  });

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        <button type="button" onClick={() => setTab('write')} className={`text-xs px-2 py-1 rounded ${tab === 'write' ? 'bg-gold text-bg-primary' : 'bg-bg-tertiary text-text-secondary'}`}>
          작성
        </button>
        <button type="button" onClick={() => setTab('preview')} className={`text-xs px-2 py-1 rounded ${tab === 'preview' ? 'bg-gold text-bg-primary' : 'bg-bg-tertiary text-text-secondary'}`}>
          미리보기
        </button>
        <button type="button" onClick={() => insert('## ', '')} className="text-xs px-2 py-1 rounded bg-bg-tertiary text-text-secondary">제목</button>
        <button type="button" onClick={() => insert('- ', '')} className="text-xs px-2 py-1 rounded bg-bg-tertiary text-text-secondary">목록</button>
        <button type="button" onClick={() => insert('**', '**')} className="text-xs px-2 py-1 rounded bg-bg-tertiary text-text-secondary">굵게</button>
      </div>

      {tab === 'write' ? (
        <textarea
          id={`editor-${name}`}
          name={name}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full bg-bg-primary border border-border-light rounded px-4 py-3 text-text-primary focus:border-gold outline-none transition"
          required
        />
      ) : (
        <>
          <textarea
            name={name}
            value={content}
            readOnly
            className="sr-only"
            tabIndex={-1}
            aria-hidden
          />
          <div className="min-h-[200px] p-4 bg-bg-primary border border-border-light rounded text-text-secondary text-sm">
            {content ? previewHtml : <p className="text-text-muted">미리볼 내용이 없습니다</p>}
          </div>
        </>
      )}
      <p className="text-xs text-text-secondary mt-2">## 제목, - 목록, **굵게** · 임시저장은 브라우저에 자동 저장됩니다</p>
    </div>
  );
}
