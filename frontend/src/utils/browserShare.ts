/**
 * browserShare.ts — Issue #488
 *
 * Centralised capability checks and normalised outcomes for browser
 * share / clipboard / app-link flows. Replaces inline branching in
 * ShareModal, QRCodeGenerator, SplitCalculator, and PaymentURIHandler.
 */

// ── Capability detection ───────────────────────────────────────────────────────

/** True when the Web Share API is available and can share URLs. */
export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/** True when the async Clipboard API is available for writing. */
export function canWriteClipboard(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  );
}

// ── Outcome type ──────────────────────────────────────────────────────────────

export type ShareOutcome =
  | { method: 'native-share'; success: true }
  | { method: 'clipboard'; success: true }
  | { method: 'clipboard'; success: false; error: Error }
  | { method: 'unsupported'; success: false };

// ── Share data ─────────────────────────────────────────────────────────────────

export interface ShareData {
  title?: string;
  text?: string;
  url: string;
}

// ── Core helper ───────────────────────────────────────────────────────────────

/**
 * Attempt to share `data` using the best available browser API:
 *
 * 1. Native share (Web Share API) — preferred on mobile.
 * 2. Async Clipboard API — desktop fallback.
 * 3. Unsupported — returns `{ method: 'unsupported', success: false }`.
 *
 * A rejected native share (user dismissed) is treated as a clipboard fallback
 * so the user still gets the URL if they cancelled the share sheet.
 */
export async function shareOrCopy(data: ShareData): Promise<ShareOutcome> {
  if (canNativeShare()) {
    try {
      await navigator.share({ title: data.title, text: data.text, url: data.url });
      return { method: 'native-share', success: true };
    } catch (err) {
      // User dismissed the share sheet — fall through to clipboard
      const isAbort =
        err instanceof DOMException && err.name === 'AbortError';
      if (!isAbort) {
        // Unexpected error — still try clipboard before giving up
      }
    }
  }

  if (canWriteClipboard()) {
    try {
      await navigator.clipboard.writeText(data.url);
      return { method: 'clipboard', success: true };
    } catch (err) {
      return {
        method: 'clipboard',
        success: false,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  }

  return { method: 'unsupported', success: false };
}

/**
 * Copy text to the clipboard with a typed outcome.
 * Use this when you only need clipboard (e.g. copying a raw link without sharing).
 */
export async function copyToClipboard(
  text: string,
): Promise<{ success: true } | { success: false; error: Error }> {
  if (!canWriteClipboard()) {
    return { success: false, error: new Error('Clipboard API not supported') };
  }
  try {
    await navigator.clipboard.writeText(text);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}
