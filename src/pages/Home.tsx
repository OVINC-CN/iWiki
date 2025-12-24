import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/useApp';
import { getDocs } from '../api';
import { DocCard } from '../components/DocCard';
import { SkeletonCard } from '../components/Loading';
import type { DocList } from '../types';
import '../styles/home.css';

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20h9M12 4h9M9 4H4a1 1 0 00-1 1v14a1 1 0 001 1h5a1 1 0 001-1V5a1 1 0 00-1-1z" />
      </svg>
    ),
    title: 'Markdown 支持',
    description: '使用 Markdown 语法撰写文章，支持 GFM 扩展语法、代码高亮等功能。',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3h18v18H3zM12 8v8M8 12h8" />
      </svg>
    ),
    title: 'Mermaid 图表',
    description: '内置 Mermaid 支持，可以直接在文章中绘制流程图、时序图等。',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16v16H4zM9 9h6v6H9z" />
      </svg>
    ),
    title: '数学公式',
    description: '支持 LaTeX 数学公式渲染，让技术文档更加专业。',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
      </svg>
    ),
    title: '图片上传',
    description: '支持拖拽或粘贴上传图片，自动上传至云存储。',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
    title: '全文搜索',
    description: '强大的搜索功能，支持按标题、内容、标签多维度搜索。',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    title: '响应式设计',
    description: '完美适配各种设备，随时随地阅读和编辑文章。',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export const Home: React.FC = () => {
  const { isLoggedIn, hasPermission, login } = useApp();
  const [recentDocs, setRecentDocs] = useState<DocList[]>([]);
  const [loading, setLoading] = useState(true);

  const canCreateDoc = hasPermission('create_doc');

  useEffect(() => {
    const fetchRecentDocs = async () => {
      try {
        const response = await getDocs({ page: 1, size: 6 });
        setRecentDocs(response.data.data.results);
      } catch (error) {
        console.error('Failed to fetch recent docs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentDocs();
  }, []);

  return (
    <div className="home">
      <motion.section 
        className="hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="hero-content">
          <motion.h1 
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            探索知识的<span className="highlight">无限可能</span>
          </motion.h1>
          <motion.p 
            className="hero-description"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            一个简洁优雅的个人博客平台，用 Markdown 记录你的想法，分享你的知识。
          </motion.p>
          <motion.div 
            className="hero-actions"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link to="/docs" className="btn btn-primary">
              浏览文章
            </Link>
            {canCreateDoc ? (
              <Link to="/docs/new" className="btn btn-secondary">
                开始写作
              </Link>
            ) : !isLoggedIn ? (
              <button className="btn btn-secondary" onClick={login}>
                登录
              </button>
            ) : null}
          </motion.div>
        </div>
      </motion.section>

      <motion.section 
        className="features"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <h2 className="features-title">功能特性</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div key={index} className="feature-card" variants={itemVariants}>
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {recentDocs.length > 0 && (
        <motion.section 
          className="recent-docs"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="section-header">
            <h2 className="section-title">最新文章</h2>
            <Link to="/docs" className="section-link">
              查看全部
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="docs-grid">
            {loading
              ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
              : recentDocs.map((doc) => (
                  <motion.div key={doc.id} variants={itemVariants}>
                    <DocCard doc={doc} />
                  </motion.div>
                ))
            }
          </div>
        </motion.section>
      )}
    </div>
  );
};

export default Home;
