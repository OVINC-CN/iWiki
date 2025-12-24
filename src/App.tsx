import { Routes, Route } from 'react-router-dom'
import { useApp } from './contexts/useApp'
import { Layout } from './components/Layout'
import { Loading } from './components/Loading'
import { Home } from './pages/Home'
import { DocsList } from './pages/DocsList'
import { DocDetail } from './pages/DocDetail'
import { DocEditor } from './pages/DocEditor'
import { LoginCallback } from './pages/LoginCallback'

function App() {
  const { loading, t } = useApp()

  if (loading) {
    return <Loading fullPage text={t.common.loading} />
  }

  return (
    <Routes>
      <Route path="/login/callback" element={<LoginCallback />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/docs" element={<DocsList />} />
        <Route path="/docs/new" element={<DocEditor />} />
        <Route path="/docs/:id" element={<DocDetail />} />
        <Route path="/docs/:id/edit" element={<DocEditor />} />
      </Route>
    </Routes>
  )
}

export default App
