/**
 * pwa.ts — Issue #487
 * Typed contracts for the PWA install prompt lifecycle.
 */

/** Typed wrapper around the `BeforeInstallPromptEvent` (not yet in TS lib). */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/** Possible outcomes after calling `prompt()`. */
export type InstallOutcome = 'accepted' | 'dismissed';

/** Public API surface returned by `usePWA`. */
export interface PWAHook {
  isOnline: boolean;
  /** True when a deferred install prompt is available. */
  canInstall: boolean;
  /** Trigger the browser's install prompt. Resolves to the user's outcome. */
  installApp: () => Promise<InstallOutcome | null>;
}
