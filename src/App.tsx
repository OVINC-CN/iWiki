import { Routes, Route, Navigate, useSearchParams } from 'react-router';
import { useApp } from '@/contexts/useApp';
import { Layout } from '@/components/Layout';
import { Loading } from '@/components/Loading';
import { Home } from '@/pages/Home';
import { DocsList } from '@/pages/DocsList';
import { DocDetail } from '@/pages/DocDetail';
import { DocEditor } from '@/pages/DocEditor';
import { LoginCallback } from '@/pages/LoginCallback';
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
    const { loading, t } = useApp();

    if (loading) {
        return <Loading fullPage text={t.common.loading} />;
    }

    return (
        <Routes>
            <Route path={pagePaths.loginCallback} element={<LoginCallback />} />
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
