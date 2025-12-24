import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

export const Layout: React.FC = () => {
  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <footer style={{
        padding: '2rem',
        textAlign: 'center',
        borderTop: '1px solid var(--border)',
        color: 'var(--text-muted)',
        fontSize: '0.875rem',
      }}>
        <p>© {new Date().getFullYear()} iWiki. All rights reserved.</p>
      </footer>
    </>
  );
};

export default Layout;
