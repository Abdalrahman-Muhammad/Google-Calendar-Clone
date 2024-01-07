import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cc } from '../utils/cc';

export type ModalProps = {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
};

export function Modal({ children, isOpen, onClose }: ModalProps) {
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const preIsOpen = useRef<boolean>();
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handler);

    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [onClose]);

  useLayoutEffect(() => {
    if (!isOpen && preIsOpen.current) {
      setIsClosing(true);
    }
    preIsOpen.current = isOpen;
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  return createPortal(
    <div
      onAnimationEnd={() => setIsClosing(false)}
      className={cc('modal', isClosing && 'closing')}
    >
      <div className="overlay" onClick={onClose}></div>
      <div className="modal-body">{children}</div>
    </div>,
    document.querySelector('#modal-container') as HTMLElement
  );
}
