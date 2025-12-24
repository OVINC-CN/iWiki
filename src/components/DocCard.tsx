import React from 'react';
import { Link } from 'react-router-dom';
import type { DocList } from '../types';
import { formatRelativeTime } from '../utils/date';
import '../styles/docCard.css';

interface DocCardProps {
  doc: DocList;
}

export const DocCard: React.FC<DocCardProps> = ({ doc }) => {
  return (
    <Link to={`/docs/${doc.id}`} className="doc-card">
      <div className="doc-card-image">
        {doc.header_img ? (
          <img src={doc.header_img} alt={doc.title} loading="lazy" />
        ) : (
          <div className="doc-card-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
        )}
      </div>
      <div className="doc-card-content">
        <h3 className="doc-card-title">{doc.title}</h3>
        <div className="doc-card-meta">
          <span className="doc-card-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {formatRelativeTime(doc.created_at)}
          </span>
        </div>
        {doc.tags.length > 0 && (
          <div className="doc-card-tags">
            {doc.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="doc-card-tag">
                {tag}
              </span>
            ))}
            {doc.tags.length > 3 && (
              <span className="doc-card-tag">+{doc.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
      <div className="doc-card-footer">
        <div className="doc-card-author">
          <span>{doc.owner_nick_name || doc.owner}</span>
        </div>
        <div className="doc-card-stats">
          <span className="doc-card-stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {formatRelativeTime(doc.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default DocCard;
