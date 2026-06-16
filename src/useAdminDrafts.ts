import { useEffect, useRef, useState } from 'react';
import { createDefaultAdminDrafts, normalizeAdminDrafts, type AdminDrafts } from './adminDrafts';

type SyncState = 'loading' | 'ready' | 'saving' | 'error';

async function assertApiOnline(): Promise<void> {
  const response = await fetch('/api/health');
  if (!response.ok) {
    throw new Error(`API offline: ${response.status}`);
  }
}

async function loadContentFromApi(): Promise<AdminDrafts> {
  await assertApiOnline();
  const response = await fetch('/api/content');
  if (!response.ok) {
    throw new Error(`Failed to load content: ${response.status}`);
  }
  return normalizeAdminDrafts((await response.json()) as AdminDrafts);
}

async function saveContentToApi(drafts: AdminDrafts): Promise<AdminDrafts> {
  const response = await fetch('/api/content', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(drafts)
  });
  if (!response.ok) {
    throw new Error(`Failed to save content: ${response.status}`);
  }
  return normalizeAdminDrafts((await response.json()) as AdminDrafts);
}

async function resetContentToApi(): Promise<AdminDrafts> {
  await assertApiOnline();
  const response = await fetch('/api/reset', {
    method: 'POST'
  });
  if (!response.ok) {
    throw new Error(`Failed to reset content: ${response.status}`);
  }
  return normalizeAdminDrafts((await response.json()) as AdminDrafts);
}

export function useAdminDrafts() {
  const [drafts, setDrafts] = useState<AdminDrafts>(() => createDefaultAdminDrafts());
  const [syncState, setSyncState] = useState<SyncState>('loading');
  const [error, setError] = useState<string | null>(null);
  const hydratedRef = useRef(false);
  const lastSavedRef = useRef('');
  const draftSignature = JSON.stringify(drafts);

  const refreshDrafts = async () => {
    try {
      setSyncState('saving');
      const next = await loadContentFromApi();
      setDrafts(next);
      setSyncState('ready');
      setError(null);
      hydratedRef.current = true;
      lastSavedRef.current = JSON.stringify(next);
    } catch (refreshError) {
      setSyncState('error');
      setError(formatAdminError(refreshError, 'Failed to reload content'));
    }
  };

  useEffect(() => {
    let cancelled = false;
    refreshDrafts()
      .then(() => {
        if (cancelled) return;
      })
      .catch(() => {
        if (cancelled) return;
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const serialized = JSON.stringify(drafts);
    if (serialized === lastSavedRef.current) return;
    let cancelled = false;
    setSyncState('saving');
    saveContentToApi(drafts)
      .then((next) => {
        if (cancelled) return;
        const nextSerialized = JSON.stringify(next);
        lastSavedRef.current = nextSerialized;
        setDrafts(next);
        setSyncState('ready');
        setError(null);
      })
      .catch((saveError) => {
        if (cancelled) return;
        setSyncState('error');
        setError(formatAdminError(saveError, 'Failed to save content'));
      });
    return () => {
      cancelled = true;
    };
  }, [drafts]);

  const resetDrafts = async () => {
    try {
      setSyncState('saving');
      const next = await resetContentToApi();
      setDrafts(next);
      setSyncState('ready');
      setError(null);
      hydratedRef.current = true;
      lastSavedRef.current = JSON.stringify(next);
    } catch (resetError) {
      setSyncState('error');
      setError(formatAdminError(resetError, 'Failed to reset content'));
      setDrafts(createDefaultAdminDrafts());
    }
  };

  const isContentStale = hydratedRef.current && draftSignature !== lastSavedRef.current;
  const contentStatusLabel =
    syncState === 'loading'
      ? 'Loading API'
      : syncState === 'saving'
        ? 'Syncing API'
        : syncState === 'error'
          ? 'API error'
          : isContentStale
            ? 'API stale'
            : 'API synced';

  return { drafts, setDrafts, resetDrafts, refreshDrafts, syncState, error, contentStatusLabel, isContentStale };
}

function formatAdminError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    if (error.message.startsWith('API offline')) {
      return 'API offline. Start the local API server with `npm run dev` or `npm run api`.';
    }
    if (error.message.includes('Failed to fetch')) {
      return 'API offline. Start the local API server with `npm run dev` or `npm run api`.';
    }
    return error.message;
  }
  return fallback;
}
