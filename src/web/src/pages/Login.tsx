import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Loader2, LogIn } from 'lucide-react';
import { startOIDCLogin } from '@/api';
import { AuthPage } from '@/components/AuthPage';
import { Button } from '@/components/ui/button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { safeReturnPath } from '@/routes';

export const Login = () => {
    const [query] = useSearchParams();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useDocumentTitle('登录');

    const login = async () => {
        if (pending) {
            return;
        }
        setPending(true);
        setError(null);
        try {
            const result = await startOIDCLogin(safeReturnPath(query.get('return_to') || '/'));
            const target = new URL(result.data.data.authorization_url);
            if (!['https:', 'http:'].includes(target.protocol) || target.username || target.password) {
                throw new Error('登录暂不可用，请稍后重试');
            }
            window.location.assign(target.href);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : '登录暂不可用，请稍后重试');
            setPending(false);
        }
    };

    return (
        <AuthPage>
            <div className="space-y-4">
                {error && <p role="alert" className="text-center text-sm text-destructive">{error}</p>}
                <Button className="w-full" size="lg" disabled={pending} onClick={login}>
                    {pending ? <Loader2 aria-hidden className="mr-2 h-4 w-4 animate-spin" /> :
                        <LogIn aria-hidden className="mr-2 h-4 w-4" />}
                    {pending ? '正在跳转...' : '继续登录'}
                </Button>
            </div>
        </AuthPage>
    );
};
