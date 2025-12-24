import { useState, useEffect, useCallback } from 'react';
import { getDocs, getBoundTags } from '../api';
import type { DocList, TagInfo } from '../types';

interface UseDocsParams {
  page?: number;
  size?: number;
  tags?: string[];
  keywords?: string;
}

export const useDocs = (params: UseDocsParams = {}) => {
  const [docs, setDocs] = useState<DocList[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDocs({
        page: params.page || 1,
        size: params.size || 10,
        tags: params.tags?.join(','),
        keywords: params.keywords,
      });
      setDocs(response.data.data.results);
      setTotal(response.data.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, [params.page, params.size, params.tags, params.keywords]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  return { docs, total, loading, error, refetch: fetchDocs };
};

export const useBoundTags = () => {
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getBoundTags({ size: 100 });
      setTags(response.data.data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return { tags, loading, error, refetch: fetchTags };
};
