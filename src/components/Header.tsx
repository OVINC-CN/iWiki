import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/useApp';
import '../styles/header.css';

export const Header: React.FC = () => {
  const { user, isLoggedIn, hasPermission, signOut, login } = useApp();
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

  const getAvatarLetter = () => {
    if (user?.nick_name) return user.nick_name.charAt(0).toUpperCase();
    if (user?.username) return user.username.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="header-logo">
          <img src="/logo.webp" alt="iWiki" />
          <span>iWiki</span>
        </Link>

        <nav className={`header-nav ${mobileMenuOpen ? 'open' : ''}`}>
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            首页
          </Link>
          <Link 
            to="/docs" 
            className={`nav-link ${location.pathname.startsWith('/docs') && !location.pathname.includes('/edit') ? 'active' : ''}`}
          >
            文章
          </Link>
          {canCreateDoc && (
            <Link 
              to="/docs/new" 
              className={`nav-link ${location.pathname === '/docs/new' ? 'active' : ''}`}
            >
              写文章
            </Link>
          )}
          
          {/* Mobile user section */}
          <div className="mobile-only" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: `1px solid var(--border)` }}>
            {isLoggedIn ? (
              <>
                <div className="nav-link" style={{ color: 'var(--text-primary)' }}>
                  {user?.nick_name || user?.username}
                </div>
                <button className="nav-link" onClick={signOut} style={{ width: '100%', textAlign: 'left' }}>
                  退出登录
                </button>
              </>
            ) : (
              <button className="nav-link" onClick={login} style={{ width: '100%', textAlign: 'left' }}>
                登录
              </button>
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
                {getAvatarLetter()}
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
                    <button className="user-dropdown-item danger" onClick={signOut}>
                      退出登录
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <button className="btn btn-primary" onClick={login}>
              登录
            </button>
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
