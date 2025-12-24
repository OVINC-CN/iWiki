import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { useDocs, useBoundTags } from '../hooks/useDocs';
import { useApp } from '../contexts/useApp';
import { DocCard } from '../components/DocCard';
import { SkeletonCard } from '../components/Loading';
import type { SearchMode } from '../types';
import '../styles/docs.css';

const PAGE_SIZE = 12;

export const DocsList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { features, t } = useApp();
  
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [keywords, setKeywords] = useState(searchParams.get('keywords') || '');
  const [searchMode, setSearchMode] = useState<SearchMode>((searchParams.get('mode') as SearchMode) || 'title');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get('tags')?.split(',').filter(Boolean) || []
  );

  const { docs, total, loading, refetch } = useDocs({
    page,
    size: PAGE_SIZE,
    tags: selectedTags,
    keywords: keywords || undefined,
  });

  const { tags: boundTags } = useBoundTags();

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (keywords) params.set('keywords', keywords);
    if (searchMode !== 'title') params.set('mode', searchMode);
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    setSearchParams(params, { replace: true });
  }, [page, keywords, searchMode, selectedTags, setSearchParams]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  }, [refetch]);

  const toggleTag = useCallback((tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    );
    setPage(1);
  }, []);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const showPages = 5;
    let startPage = Math.max(1, page - Math.floor(showPages / 2));
    const endPage = Math.min(totalPages, startPage + showPages - 1);

    if (endPage - startPage < showPages - 1) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="pagination">
        <button
          className="pagination-btn"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        
        {startPage > 1 && (
          <>
            <button className="pagination-btn" onClick={() => setPage(1)}>1</button>
            {startPage > 2 && <span className="pagination-info">...</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            className={`pagination-btn ${p === page ? 'active' : ''}`}
            onClick={() => setPage(p)}
          >
            {p}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="pagination-info">...</span>}
            <button className="pagination-btn" onClick={() => setPage(totalPages)}>
              {totalPages}
            </button>
          </>
        )}

        <button
          className="pagination-btn"
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className="docs-page">
      <motion.div
        className="docs-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="docs-title">{t.docs.listTitle}</h1>
        
        <form className="docs-filters" onSubmit={handleSearch}>
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder={t.docs.searchPlaceholder}
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>
          
          {features?.doc_fuzzy_search && (
            <select
              className="search-mode-select"
              value={searchMode}
              onChange={(e) => {
                setSearchMode(e.target.value as SearchMode);
                setPage(1);
              }}
            >
              <option value="title">{t.docs.searchTitle}</option>
              <option value="content">{t.docs.searchContent}</option>
              <option value="all">{t.docs.searchAll}</option>
            </select>
          )}
        </form>

        {boundTags?.length > 0 && (
          <div className="tags-filter">
            {boundTags.map((tag) => (
              <button
                key={tag.id}
                className={`tag-btn ${selectedTags.includes(tag.name) ? 'active' : ''}`}
                onClick={() => toggleTag(tag.name)}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            className="docs-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {Array(6).fill(0).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </motion.div>
        ) : docs.length > 0 ? (
          <motion.div
            key="docs"
            className="docs-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {docs.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <DocCard doc={doc} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className="docs-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <h3>{t.docs.noDocs}</h3>
            <p>{t.docs.noDocsDesc}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {renderPagination()}
    </div>
  );
};

export default DocsList;
