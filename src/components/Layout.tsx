import type React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import { Separator } from '@/components/ui/separator';

export const Layout: React.FC = () => {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Separator />
      <footer className="py-4 px-8 text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} iWiki. All rights reserved.</p>
      </footer>
    </>
  );
};

export default Layout;
