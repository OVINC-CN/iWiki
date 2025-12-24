import React, { useState, useCallback, useMemo } from 'react';
import { Modal } from '../components/Modal.tsx';
import { useApp } from './useApp';
import { ModalContext } from './ModalContext';

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title?: string;
    content: React.ReactNode;
    footer?: React.ReactNode;
  }>({ content: null });
  const { t } = useApp();

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const showAlert = useCallback((message: string, title?: string) => {
    setModalConfig({
      title,
      content: <p>{message}</p>,
      footer: (
        <button className="btn btn-primary" onClick={closeModal}>
          {t.common?.confirm || 'OK'}
        </button>
      ),
    });
    setIsOpen(true);
  }, [closeModal, t]);

  const value = useMemo(() => ({ showAlert, closeModal }), [showAlert, closeModal]);

  return (
    <ModalContext.Provider value={value}>
      {children}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        content={modalConfig.content}
        footer={modalConfig.footer}
      />
    </ModalContext.Provider>
  );
};
