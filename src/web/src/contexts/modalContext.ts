import { createContext } from 'react';

export interface ModalContextType {
  showAlert: (message: string, title?: string) => void;
  closeModal: () => void;
}

export const ModalContext = createContext<ModalContextType | null>(null);
