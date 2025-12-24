import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { useDocs, useBoundTags } from '../hooks/useDocs';
import { useApp } from '../contexts/useApp';
import { DocCard } from '../components/DocCard';
import { SkeletonCard } from '../components/Loading';
import '../styles/docs.css';

const PAGE_SIZE = 12;
const INITIAL_TAGS_COUNT = 10;

export const DocsList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { features, t } = useApp();
  
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [inputValue, setInputValue] = useState('');
  const [keywords, setKeywords] = useState<string[]>(
    searchParams.get('keywords')?.split(',').filter(Boolean) || []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get('tags')?.split(',').filter(Boolean) || []
  );
  const [showAllTags, setShowAllTags] = useState(false);

  // Process keywords to support multiple values separated by space or comma
  const processedKeywords = useMemo(() => {
    if (keywords.length === 0) return undefined;
    return keywords.join(',');
  }, [keywords]);

  const { docs, total, loading } = useDocs({
    page,
    size: PAGE_SIZE,
    tags: selectedTags,
    keywords: processedKeywords,
  });

  const { tags: boundTags } = useBoundTags();

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (keywords.length > 0) params.set('keywords', keywords.join(','));
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    setSearchParams(params, { replace: true });
  }, [page, keywords, selectedTags, setSearchParams]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newKeyword = inputValue.trim();
      if (newKeyword && !keywords.includes(newKeyword)) {
        setKeywords([...keywords, newKeyword]);
        setInputValue('');
        setPage(1);
      }
    } else if (e.key === 'Backspace' && !inputValue && keywords.length > 0) {
      setKeywords(keywords.slice(0, -1));
      setPage(1);
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
    setPage(1);
  };

  const toggleTag = useCallback((tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    );
    setPage(1);
  }, []);

  const visibleTags = useMemo(() => {
    if (showAllTags) return boundTags;
    return boundTags.slice(0, INITIAL_TAGS_COUNT);
  }, [boundTags, showAllTags]);

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
        {features?.doc_fuzzy_search && (
          <form className="docs-filters" onSubmit={handleSearch}>
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <div 
                className="search-box-container" 
                onClick={() => document.getElementById('search-input')?.focus()}
              >
                {keywords.map((k) => (
                  <span key={k} className="search-keyword-chip">
                    {k}
                    <button 
                      type="button" 
                      className="search-keyword-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeKeyword(k);
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  id="search-input"
                  type="text"
                  className="search-box-input"
                  placeholder={keywords.length === 0 ? t.docs.searchPlaceholder : ''}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>
          </form>
        )}

        {boundTags?.length > 0 && (
          <div className="tags-filter-container">
            <div className="tags-filter">
              {visibleTags.map((tag) => (
                <button
                  key={tag.id}
                  className={`tag-btn ${selectedTags.includes(tag.name) ? 'active' : ''}`}
                  onClick={() => toggleTag(tag.name)}
                >
                  {tag.name}
                </button>
              ))}
            </div>
            {boundTags.length > INITIAL_TAGS_COUNT && (
              <button 
                className="tags-expand-btn"
                onClick={() => setShowAllTags(!showAllTags)}
              >
                {showAllTags ? t.docs.showLess : `${t.docs.showMore} (${boundTags.length - INITIAL_TAGS_COUNT})`}
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  style={{ transform: showAllTags ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            )}
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
