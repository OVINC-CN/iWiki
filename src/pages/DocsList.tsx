import type React from 'react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { useDocs, useBoundTags } from '@/hooks/useDocs';
import { useApp } from '@/contexts/useApp';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { DocCard } from '@/components/DocCard';
import { SkeletonCard } from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Search, FileText, ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';

const PAGE_SIZE = 12;
const INITIAL_TAGS_COUNT = 10;

export const DocsList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { features, t } = useApp();
  
  useDocumentTitle(t.common.articles);

  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [inputValue, setInputValue] = useState('');
  const [keywords, setKeywords] = useState<string[]>(
    searchParams.get('keywords')?.split(',').filter(Boolean) || []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get('tags')?.split(',').filter(Boolean) || []
  );
  const [showAllTags, setShowAllTags] = useState(false);

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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

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
      <div className="flex items-center justify-center gap-1 mt-8">
        <Button
          variant="outline"
          size="icon"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {startPage > 1 && (
          <>
            <Button variant="outline" size="sm" onClick={() => setPage(1)}>
              1
            </Button>
            {startPage > 2 && <span className="px-2 text-muted-foreground">...</span>}
          </>
        )}

        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPage(p)}
          >
            {p}
          </Button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 text-muted-foreground">...</span>}
            <Button variant="outline" size="sm" onClick={() => setPage(totalPages)}>
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="icon"
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        className="space-y-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {features?.doc_fuzzy_search && (
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <div
                className="flex flex-wrap items-center gap-2 min-h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text"
                onClick={() => document.getElementById('search-input')?.focus()}
              >
                {keywords.map((k) => (
                  <Badge key={k} variant="secondary" className="gap-1">
                    {k}
                    <button
                      type="button"
                      className="hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeKeyword(k);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  id="search-input"
                  type="text"
                  className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground"
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
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {visibleTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.includes(tag.name) ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors hover:bg-primary/20"
                  onClick={() => toggleTag(tag.name)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
            {boundTags.length > INITIAL_TAGS_COUNT && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => setShowAllTags(!showAllTags)}
              >
                {showAllTags ? t.docs.showLess : `${t.docs.showMore} (${boundTags.length - INITIAL_TAGS_COUNT})`}
                <ChevronDown
                  className={cn('h-4 w-4 ml-1 transition-transform', showAllTags && 'rotate-180')}
                />
              </Button>
            )}
          </div>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <SkeletonCard key={i} />
              ))}
          </motion.div>
        ) : docs.length > 0 ? (
          <motion.div
            key="docs"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
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
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">{t.docs.noDocs}</h3>
            <p className="text-muted-foreground">{t.docs.noDocsDesc}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {renderPagination()}
    </div>
  );
};

export default DocsList;
