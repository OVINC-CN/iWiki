import type React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { useApp } from './useApp';
import { ModalContext } from './modalContext';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<{
    title?: string;
    message: string;
  }>({ message: '' });
    const { t } = useApp();

    const closeModal = useCallback(() => {
        setIsOpen(false);
    }, []);

    const showAlert = useCallback((message: string, title?: string) => {
        setModalConfig({
            title,
            message,
        });
        setIsOpen(true);
    }, []);

    const value = useMemo(() => ({ showAlert, closeModal }), [showAlert, closeModal]);

    return (
        <ModalContext.Provider value={value}>
            {children}
            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        {modalConfig.title && <AlertDialogTitle>{modalConfig.title}</AlertDialogTitle>}
                        <AlertDialogDescription>
                            {modalConfig.message}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={closeModal}>
                            {t.common?.confirm || 'OK'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ModalContext.Provider>
    );
};
