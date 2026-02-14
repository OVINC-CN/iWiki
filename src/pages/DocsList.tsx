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
import { Search, FileText, ChevronLeft, ChevronRight, Tag, X } from 'lucide-react';

const PAGE_SIZE = 12;
const TAG_PREFIX = 'tag:';
const STORAGE_KEY = 'docsListSearch';

const readSavedSearch = (): { page: number; tokens: string[] } => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const params = new URLSearchParams(saved);
            const page = Number(params.get('page')) || 1;
            const q = params.get('q');
            const tokens = q ? q.split(',').filter(Boolean) : [];
            return { page, tokens };
        }
    } catch {}
    return { page: 1, tokens: [] };
};

export const DocsList: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { features, t } = useApp();

    useDocumentTitle(t.common.articles);

    const hasUrlParams = searchParams.has('q') || searchParams.has('page') || searchParams.has('keywords') || searchParams.has('tags');

    const [page, setPage] = useState(() => {
        if (hasUrlParams) {
            return Number(searchParams.get('page')) || 1;
        }
        return readSavedSearch().page;
    });
    const [inputValue, setInputValue] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const [tokens, setTokens] = useState<string[]>(() => {
        if (hasUrlParams) {
            const q = searchParams.get('q');
            if (q) {
                return q.split(',').filter(Boolean);
            }
            // Backward compatibility: read old format
            const oldKeywords = searchParams.get('keywords')?.split(',').filter(Boolean) || [];
            const oldTags = searchParams.get('tags')?.split(',').filter(Boolean).map((t) => `${TAG_PREFIX}${t}`) || [];
            return [...oldKeywords, ...oldTags];
        }
        return readSavedSearch().tokens;
    });

    const parsedTokens = useMemo(() => {
        const tags: string[] = [];
        const keywords: string[] = [];
        for (const token of tokens) {
            if (token.startsWith(TAG_PREFIX)) {
                tags.push(token.slice(TAG_PREFIX.length));
            } else {
                keywords.push(token);
            }
        }
        return { tags, keywords };
    }, [tokens]);

    const processedKeywords = useMemo(() => {
        if (parsedTokens.keywords.length === 0) {
            return undefined;
        }
        return parsedTokens.keywords.join(',');
    }, [parsedTokens.keywords]);

    const { docs, total, loading } = useDocs({
        page,
        size: PAGE_SIZE,
        tags: parsedTokens.tags,
        keywords: processedKeywords,
    });

    const { tags: boundTags } = useBoundTags();

    const totalPages = Math.ceil(total / PAGE_SIZE);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    useEffect(() => {
        const params = new URLSearchParams();
        if (page > 1) {
            params.set('page', String(page));
        }
        if (tokens.length > 0) {
            params.set('q', tokens.join(','));
        }
        setSearchParams(params, { replace: true });
        localStorage.setItem(STORAGE_KEY, params.toString());
    }, [page, tokens, setSearchParams]);

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
    }, []);

    const addToken = useCallback((token: string) => {
        setTokens((prev) => (prev.includes(token) ? prev : [...prev, token]));
        setInputValue('');
        setPage(1);
    }, []);

    const removeToken = useCallback((token: string) => {
        setTokens((prev) => prev.filter((t) => t !== token));
        setPage(1);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newKeyword = inputValue.trim();
            if (newKeyword) {
                addToken(newKeyword);
                setShowDropdown(false);
            }
        } else if (e.key === 'Backspace' && !inputValue && tokens.length > 0) {
            setTokens((prev) => prev.slice(0, -1));
            setPage(1);
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    const filteredTags = useMemo(() => {
        const selectedTagNames = new Set(parsedTokens.tags);
        return boundTags.filter(
            (tag) =>
                !selectedTagNames.has(tag.name) &&
                tag.name.toLowerCase().includes(inputValue.toLowerCase()),
        );
    }, [boundTags, parsedTokens.tags, inputValue]);

    const renderPagination = () => {
        if (totalPages <= 1) {
            return null;
        }

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
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-1" />
                            <div
                                className="flex flex-wrap items-center gap-2 min-h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text"
                                onClick={() => document.getElementById('search-input')?.focus()}
                            >
                                {tokens.map((token) => {
                                    const isTag = token.startsWith(TAG_PREFIX);
                                    return (
                                        <Badge key={token} variant={isTag ? 'default' : 'secondary'} className="gap-1">
                                            {isTag && <Tag className="h-3 w-3" />}
                                            {isTag ? token.slice(TAG_PREFIX.length) : token}
                                            <button
                                                type="button"
                                                className="hover:text-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeToken(token);
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    );
                                })}
                                <input
                                    id="search-input"
                                    type="text"
                                    className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground"
                                    placeholder={tokens.length === 0 ? t.docs.searchPlaceholder : ''}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => setShowDropdown(true)}
                                />
                            </div>
                            {showDropdown && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                                    <div className="absolute top-full left-0 right-0 mt-1 max-h-64 overflow-auto rounded-md border bg-popover shadow-md z-50">
                                        {inputValue.trim() && (
                                            <button
                                                className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                                                onClick={() => {
                                                    addToken(inputValue.trim());
                                                    setShowDropdown(false);
                                                }}
                                            >
                                                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                                                {t.docs.searchFor} &quot;{inputValue.trim()}&quot;
                                            </button>
                                        )}
                                        {filteredTags.length > 0 ? (
                                            filteredTags.map((tag) => (
                                                <button
                                                    key={tag.id}
                                                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                                                    onClick={() => {
                                                        addToken(`${TAG_PREFIX}${tag.name}`);
                                                        setShowDropdown(false);
                                                    }}
                                                >
                                                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {tag.name}
                                                </button>
                                            ))
                                        ) : (
                                            !inputValue.trim() && (
                                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                                    {t.docs.noMatchingTags}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </form>
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
                                // eslint-disable-next-line react/no-array-index-key
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
