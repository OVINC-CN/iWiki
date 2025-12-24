import React from 'react';
import '../styles/loading.css';

interface LoadingProps {
  size?: 'small' | 'normal';
  text?: string;
  fullPage?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'normal',
  text,
  fullPage = false,
}) => {
  const content = (
    <div className="loading-container">
      <div className={`loading-spinner ${size === 'small' ? 'small' : ''}`} />
      {text && <div className="loading-text">{text}</div>}
    </div>
  );

  if (fullPage) {
    return <div className="page-loading">{content}</div>;
  }

  return content;
};

export const Skeleton: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className = '',
  style,
}) => {
  return <div className={`skeleton ${className}`} style={style} />;
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="skeleton-card">
      <Skeleton className="skeleton-image" />
      <Skeleton className="skeleton-title" />
      <Skeleton className="skeleton-text" />
      <Skeleton className="skeleton-text" />
      <Skeleton className="skeleton-text" />
    </div>
  );
};

export default Loading;
