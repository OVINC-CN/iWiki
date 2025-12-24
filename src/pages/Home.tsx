import type React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '@/contexts/useApp';
import { Button } from '@/components/ui/button';

export const Home: React.FC = () => {
  const { isLoggedIn, hasPermission, login, t } = useApp();

  const canCreateDoc = hasPermission('create_doc');

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <motion.section
        className="relative flex flex-col items-center justify-center px-4 text-center bg-gradient-to-b from-background to-muted/50"
        style={{ minHeight: 'calc(100vh - 3.5rem - 5rem)' }} // 100vh - header(3.5rem) - footer(approx 5rem)
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-3xl mx-auto space-y-6">
          <motion.h1
            className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-foreground"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t.home.heroTitle}
            <span className="text-primary">{t.home.heroTitleHighlight}</span>
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {t.home.heroDesc}
          </motion.p>
          <motion.div
            className="flex flex-wrap items-center justify-center gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button asChild size="lg">
              <Link to="/docs">{t.home.browse}</Link>
            </Button>
            {canCreateDoc ? (
              <Button asChild variant="outline" size="lg">
                <Link to="/docs/new">{t.home.startWriting}</Link>
              </Button>
            ) : !isLoggedIn ? (
              <Button variant="outline" size="lg" onClick={login}>
                {t.common.login}
              </Button>
            ) : null}
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default Home;
