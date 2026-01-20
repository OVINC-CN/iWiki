import type React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '@/contexts/useApp';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/button';
import { ShieldX } from 'lucide-react';

export const Forbidden: React.FC = () => {
    const { t, login } = useApp();

    useDocumentTitle(t.common?.forbidden || 'Access Denied');

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
            <motion.div
                className="text-center space-y-6 px-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex justify-center">
                    <div className="rounded-full bg-destructive/10 p-6">
                        <ShieldX className="h-16 w-16 text-destructive" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h1 className="text-6xl font-bold text-foreground">403</h1>
                    <h2 className="text-xl font-semibold text-foreground">
                        {t.common?.forbidden || 'Access Denied'}
                    </h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        {t.common?.forbiddenDesc || 'You do not have permission to access this page.'}
                    </p>
                </div>
                <div className="flex items-center justify-center gap-4">
                    <Button asChild variant="outline">
                        <Link to="/">{t.common?.backHome || 'Back to Home'}</Link>
                    </Button>
                    <Button onClick={login}>{t.common?.login || 'Sign In'}</Button>
                </div>
            </motion.div>
        </div>
    );
};

export default Forbidden;
