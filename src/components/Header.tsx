import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/useApp';
import '../styles/header.css';

export const Header: React.FC = () => {
  const { user, isLoggedIn, hasPermission, signOut, login, language, changeLanguage, t } = useApp();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const canCreateDoc = hasPermission('create_doc');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname, closeMobileMenu]);

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="header-logo">
          <img src="/logo.webp" alt="iWiki" />
        </Link>

        <nav className={`header-nav ${mobileMenuOpen ? 'open' : ''}`}>
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            {t.common.home}
          </Link>
          <Link 
            to="/docs" 
            className={`nav-link ${location.pathname.startsWith('/docs') && !location.pathname.includes('/edit') && !location.pathname.includes("/new") ? 'active' : ''}`}
          >
            {t.common.articles}
          </Link>
          {canCreateDoc && (
            <Link 
              to="/docs/new" 
              className={`nav-link ${location.pathname === '/docs/new' ? 'active' : ''}`}
            >
              {t.common.write}
            </Link>
          )}
          
          {/* Mobile user section */}
          <div className="mobile-only" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: `1px solid var(--border)` }}>
            {isLoggedIn ? (
              <>
                <div className="nav-link" style={{ color: 'var(--text-primary)' }}>
                  {user?.nick_name || user?.username}
                </div>
                <button 
                  className="nav-link mobile-action-btn" 
                  onClick={() => changeLanguage(language === 'zh-hans' ? 'en' : 'zh-hans')}
                  style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  {language === 'zh-hans' ? t.common.switchToEn : t.common.switchToZh}
                </button>
                <button className="nav-link mobile-danger-btn" onClick={signOut} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  {t.common.logout}
                </button>
              </>
            ) : (
              <>
                <button 
                  className="nav-link mobile-action-btn" 
                  onClick={() => changeLanguage(language === 'zh-hans' ? 'en' : 'zh-hans')}
                  style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  {language === 'zh-hans' ? t.common.switchToEn : t.common.switchToZh}
                </button>
                <button className="nav-link mobile-primary-btn" onClick={login} style={{ width: '100%', textAlign: 'left' }}>
                  {t.common.login}
                </button>
              </>
            )}
          </div>
        </nav>

        <div className="user-menu desktop-only" ref={dropdownRef}>
          {isLoggedIn ? (
            <>
              <div 
                className="user-avatar" 
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    className="user-dropdown"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="user-dropdown-item" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span>{user?.nick_name || user?.username}</span>
                    </div>
                    <button 
                      className="user-dropdown-item" 
                      onClick={() => changeLanguage(language === 'zh-hans' ? 'en' : 'zh-hans')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      <span>{language === 'zh-hans' ? t.common.switchToEn : t.common.switchToZh}</span>
                    </button>
                    <button className="user-dropdown-item danger" onClick={signOut}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span>{t.common.logout}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <>
              <button className="btn btn-primary" onClick={login}>
                {t.common.login}
              </button>
            </>
          )}
        </div>

        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileMenuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>
      </div>

      <style>{`
        .mobile-only { display: none; }
        @media (max-width: 768px) {
          .desktop-only { display: none; }
          .mobile-only { display: block; }
        }
      `}</style>
    </header>
  );
};

export default Header;
