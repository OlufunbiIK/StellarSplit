/**
 * usePWA.ts — Issue #487
 *
 * Typed PWA hook with:
 *  - No `any` install-prompt state (uses BeforeInstallPromptEvent)
 *  - All window listeners registered with stable named handlers and removed on cleanup
 *  - Prompt reset after install via returned outcome
 *  - Clear `canInstall` boolean so consumers don't inspect the event object
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BeforeInstallPromptEvent, InstallOutcome, PWAHook } from '../types/pwa';

export const usePWA = (): PWAHook => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      promptRef.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    const handleAppInstalled = () => {
      promptRef.current = null;
      setCanInstall(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async (): Promise<InstallOutcome | null> => {
    if (!promptRef.current) return null;
    await promptRef.current.prompt();
    const { outcome } = await promptRef.current.userChoice;
    promptRef.current = null;
    setCanInstall(false);
    return outcome;
  }, []);

  return { isOnline, canInstall, installApp };
};
