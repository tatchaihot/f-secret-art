'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Keeps full-screen modals/lightboxes synchronized with browser history so mobile
 * edge-swipe back or hardware back closes the overlay instead of leaving the page.
 */
export function useModalBackHandler(
  isOpen: boolean,
  onClose: () => void,
  modalKey: string
): () => void {
  const historyPushedRef = useRef(false);
  const closingViaBackRef = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      historyPushedRef.current = false;
      closingViaBackRef.current = false;
      return;
    }

    if (!historyPushedRef.current && typeof window !== 'undefined') {
      window.history.pushState({ fsecretModal: modalKey }, '');
      historyPushedRef.current = true;
    }

    const handlePopState = () => {
      if (closingViaBackRef.current) {
        closingViaBackRef.current = false;
        return;
      }
      if (historyPushedRef.current) {
        historyPushedRef.current = false;
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, modalKey]);

  return useCallback(() => {
    onCloseRef.current();
    if (historyPushedRef.current && typeof window !== 'undefined') {
      historyPushedRef.current = false;
      closingViaBackRef.current = true;
      window.history.back();
    }
  }, []);
}
