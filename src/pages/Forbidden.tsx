import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/useApp';
import '../styles/home.css';

export const Forbidden: React.FC = () => {
  const { t, login } = useApp();

  return (
    <div className="home" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
      <motion.div 
        className="hero-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center' }}
      >
        <motion.h1
          className="hero-title"
          style={{ fontSize: '6rem', marginBottom: '1rem' }}
        >
          403
        </motion.h1>
        <motion.h2
          className="section-title"
          style={{ marginBottom: '1.5rem' }}
        >
          {t.common?.forbidden || 'Access Denied'}
        </motion.h2>
        <motion.p 
          className="hero-description"
          style={{ marginBottom: '2rem' }}
        >
          {t.common?.forbiddenDesc || 'You do not have permission to access this page.'}
        </motion.p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/" className="btn btn-secondary">
            {t.common?.backHome || 'Back to Home'}
          </Link>
          <button onClick={login} className="btn btn-primary">
            {t.common?.login || 'Sign In'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Forbidden;
