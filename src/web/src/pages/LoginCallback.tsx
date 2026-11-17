import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Loader2 } from 'lucide-react';
import { completeOIDCLogin } from '@/api';
import { AuthPage } from '@/components/AuthPage';
import { Button } from '@/components/ui/button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { pagePaths, safeReturnPath } from '@/routes';
import { parseOIDCCallback } from '@/utils/auth';

export const LoginCallback = () => {
    const [search] = useState(() => window.location.search);
    const [error, setError] = useState<string | null>(null);
    const completion = useRef<Promise<string> | null>(null);

    useDocumentTitle(error ? '登录失败' : '正在登录');

    useEffect(() => {
        window.history.replaceState(window.history.state, '', pagePaths.loginCallback);
        // 同一次页面挂载复用请求，避免重复消费登录状态。
        if (!completion.current) {
            completion.current = (async () => {
                const result = await completeOIDCLogin(parseOIDCCallback(search));
                return safeReturnPath(result.data.data.return_to);
            })();
        }
        let active = true;
        completion.current.then((target) => {
            if (active) {
                window.location.replace(target);
            }
        }, (reason: unknown) => {
            if (active) {
                setError(reason instanceof Error ? reason.message : '登录未完成，请重新登录');
            }
        });
        return () => {
            active = false;
        };
    }, [search]);

    return (
        <AuthPage>
            {error ? (
                <div className="space-y-6">
                    <p role="alert" className="text-center text-sm text-destructive">{error}</p>
                    <Button asChild className="w-full">
                        <Link to={pagePaths.login}>重新登录</Link>
                    </Button>
                </div>
            ) : (
                <div role="status" aria-label="正在登录" className="flex justify-center text-primary">
                    <Loader2 aria-hidden className="h-8 w-8 animate-spin" />
                </div>
            )}
        </AuthPage>
    );
};
