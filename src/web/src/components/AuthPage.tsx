import type { ReactNode } from 'react';

interface AuthPageProps {
    children: ReactNode;
}

export const AuthPage = ({ children }: AuthPageProps) => (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-xs space-y-8">
            <img src="/logo.webp?v=202606282208" alt="iWiki" className="mx-auto h-8" />
            {children}
        </div>
    </main>
);
