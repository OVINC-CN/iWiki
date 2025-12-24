import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/useApp';
import { getDocs } from '../api';
import { DocCard } from '../components/DocCard';
import { SkeletonCard } from '../components/Loading';
import type { DocList } from '../types';
import '../styles/home.css';

export const Home: React.FC = () => {
  const { isLoggedIn, hasPermission, login, t } = useApp();
  const [recentDocs, setRecentDocs] = useState<DocList[]>([]);
  const [loading, setLoading] = useState(true);

  const canCreateDoc = hasPermission('create_doc');

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
            {t.home.heroTitle}<span className="highlight">{t.home.heroTitleHighlight}</span>
          </motion.h1>
          <motion.p 
            className="hero-description"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {t.home.heroDesc}
          </motion.p>
          <motion.div 
            className="hero-actions"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link to="/docs" className="btn btn-primary">
              {t.home.browse}
            </Link>
            {canCreateDoc ? (
              <Link to="/docs/new" className="btn btn-secondary">
                {t.home.startWriting}
              </Link>
            ) : !isLoggedIn ? (
              <button className="btn btn-secondary" onClick={login}>
                {t.common.login}
              </button>
            ) : null}
          </motion.div>
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
            <h2 className="section-title">{t.home.recentArticles}</h2>
            <Link to="/docs" className="section-link">
              {t.home.viewAll}
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
