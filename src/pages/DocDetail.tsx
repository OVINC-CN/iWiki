import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import mermaid from 'mermaid';
import { getDocDetail, deleteDoc } from '../api';
import { useApp } from '../contexts/useApp';
import { Loading } from '../components/Loading';
import { formatDate } from '../utils/date';
import type { DocInfo } from '../types';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';
import '../styles/docDetail.css';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#6366f1',
    primaryTextColor: '#f1f5f9',
    primaryBorderColor: '#334155',
    lineColor: '#64748b',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a',
  },
});

export const DocDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, t } = useApp();

  const [doc, setDoc] = useState<DocInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchDoc = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await getDocDetail(id);
        setDoc(response.data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.docs.loadFailed);
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [id, t]);

  // Render mermaid diagrams
  useEffect(() => {
    if (doc?.content) {
      const renderMermaid = async () => {
        const elements = document.querySelectorAll('.language-mermaid');
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          const code = element.textContent || '';
          try {
            const { svg } = await mermaid.render(`mermaid-${i}`, code);
            const container = document.createElement('div');
            container.className = 'mermaid';
            container.innerHTML = svg;
            element.parentElement?.replaceWith(container);
          } catch (e) {
            console.error('Mermaid render error:', e);
          }
        }
      };
      setTimeout(renderMermaid, 100);
    }
  }, [doc?.content]);

  const handleDelete = useCallback(async () => {
    if (!id || !window.confirm(t.docs.deleteConfirm)) return;

    try {
      setDeleting(true);
      await deleteDoc(id);
      navigate('/docs');
    } catch {
      alert(t.docs.deleteFailed);
    } finally {
      setDeleting(false);
    }
  }, [id, navigate, t]);

  if (loading) {
    return <Loading fullPage text={t.common.loading} />;
  }

  if (error || !doc) {
    return (
      <div className="doc-detail">
        <div className="docs-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3>{error || t.docs.notFound}</h3>
          <Link to="/docs" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            {t.common.backToList}
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.username === doc.owner;

  return (
    <motion.article
      className="doc-detail"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Link to="/docs" className="doc-detail-back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        {t.common.backToList}
      </Link>

      <header className="doc-detail-header">
        <h1 className="doc-detail-title">{doc.title}</h1>
        
        <div className="doc-detail-meta">
          <div className="doc-detail-author">
            <div className="doc-detail-author-info">
              <span className="doc-detail-author-name">{doc.owner_nick_name || doc.owner}</span>
              <span className="doc-detail-date">{formatDate(doc.created_at)}</span>
            </div>
          </div>

          {isOwner && (
            <div className="doc-detail-actions">
              <Link to={`/docs/${id}/edit`} className="btn btn-secondary">
                {t.common.edit}
              </Link>
              <button
                className="btn btn-ghost"
                onClick={handleDelete}
                disabled={deleting}
                style={{ color: 'var(--error)' }}
              >
                {deleting ? t.docs.deleting : t.common.delete}
              </button>
            </div>
          )}
        </div>

        {doc.tags.length > 0 && (
          <div className="doc-detail-tags">
            {doc.tags.map((tag) => (
              <span key={tag} className="doc-detail-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {doc.header_img && (
        <img
          src={doc.header_img}
          alt={doc.title}
          className="doc-detail-header-img"
        />
      )}

      <div className="doc-detail-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
        >
          {doc.content}
        </ReactMarkdown>
      </div>
    </motion.article>
  );
};

export default DocDetail;
