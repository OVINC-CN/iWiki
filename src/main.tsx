import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '@/contexts/AppContext';
import { ModalProvider } from '@/contexts/ModalProvider';
import App from '@/App';
import '@/styles/global.css';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <AppProvider>
                <ModalProvider>
                    <App />
                </ModalProvider>
            </AppProvider>
        </BrowserRouter>
    </StrictMode>,
);
