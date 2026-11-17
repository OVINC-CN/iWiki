import { Routes, Route, Navigate, useSearchParams } from 'react-router';
import { useApp } from '@/contexts/useApp';
import { Layout } from '@/components/Layout';
import { Loading } from '@/components/Loading';
import { Home } from '@/pages/Home';
import { DocsList } from '@/pages/DocsList';
import { DocDetail } from '@/pages/DocDetail';
import { DocEditor } from '@/pages/DocEditor';
import { Button } from '@/components/ui/button';
import { Forbidden } from '@/pages/Forbidden';
import { pagePaths } from '@/routes';

function DocRoute({ edit = false }: { edit?: boolean }) {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');

    if (!id) {
        return <Navigate to={pagePaths.docs} replace />;
    }

    return edit ? <DocEditor key={id} id={id} /> : <DocDetail key={id} id={id} />;
}

function App() {
    const { loading, user, error, login, refreshUser } = useApp();

    if (loading) {
        return <Loading fullPage text="加载中..." />;
    }

    if (!user && window.location.pathname !== pagePaths.forbidden) {
        return (
            <div className="m-auto flex min-h-screen flex-col items-center justify-center gap-4 p-6">
                <p role="alert">{error || '请先登录后访问'}</p>
                <div className="flex gap-3">
                    <Button onClick={login}>重新登录</Button>
                    <Button variant="outline" onClick={() => refreshUser()}>重试</Button>
                </div>
            </div>
        );
    }

    return (
        <Routes>
            <Route path={pagePaths.forbidden} element={<Forbidden />} />
            <Route element={<Layout />}>
                <Route path={pagePaths.home} element={<Home />} />
                <Route path={pagePaths.docs} element={<DocsList />} />
                <Route path={pagePaths.docNew} element={<DocEditor />} />
                <Route path={pagePaths.docDetail} element={<DocRoute />} />
                <Route path={pagePaths.docEdit} element={<DocRoute edit />} />
            </Route>
        </Routes>
    );
}

export default App;
