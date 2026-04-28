/**
 * useCameraStream.ts — Issue #489
 *
 * Shared camera-stream lifecycle hook for QRCodeScanner and CameraCapture.
 * Owns permission checks, stream start/stop, error mapping, and cleanup on unmount
 * so neither component manages raw MediaStream state independently.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  requestCameraPermission,
  stopCameraStream,
  getUserFriendlyErrorMessage,
} from '../utils/cameraPermissions';

// ── Types ──────────────────────────────────────────────────────────────────────

export type CameraStreamStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'error'
  | 'stopped';

export interface CameraStreamError {
  type: 'permission-denied' | 'not-found' | 'not-secure' | 'unknown';
  message: string;
}

export interface UseCameraStreamOptions {
  /** MediaStream constraints forwarded to getUserMedia. */
  constraints?: MediaStreamConstraints;
  /** Start the stream automatically when the hook mounts. */
  autoStart?: boolean;
}

export interface UseCameraStreamReturn {
  status: CameraStreamStatus;
  stream: MediaStream | null;
  error: CameraStreamError | null;
  /** Request camera access and start the stream. */
  startStream: () => Promise<void>;
  /** Stop the stream and release the camera hardware. */
  stopStream: () => void;
  /** Stop then restart the stream (e.g. to switch cameras). */
  restartStream: () => Promise<void>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCameraStream({
  constraints = { video: { facingMode: 'environment' }, audio: false },
  autoStart = false,
}: UseCameraStreamOptions = {}): UseCameraStreamReturn {
  const [status, setStatus] = useState<CameraStreamStatus>('idle');
  const [error, setError] = useState<CameraStreamError | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Track mounted state to skip setState after unmount
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Always release hardware on unmount
      if (streamRef.current) {
        stopCameraStream(streamRef.current);
        streamRef.current = null;
      }
    };
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      stopCameraStream(streamRef.current);
      streamRef.current = null;
    }
    if (mountedRef.current) setStatus('stopped');
  }, []);

  const startStream = useCallback(async () => {
    if (!mountedRef.current) return;
    setStatus('requesting');
    setError(null);

    try {
      const stream = await requestCameraPermission(constraints);
      streamRef.current = stream;
      if (mountedRef.current) setStatus('active');
    } catch (err) {
      const message = getUserFriendlyErrorMessage(err as Error);
      if (mountedRef.current) {
        setStatus('error');
        setError({ type: 'unknown', message });
      }
    }
  }, [constraints]);

  const restartStream = useCallback(async () => {
    stopStream();
    await startStream();
  }, [stopStream, startStream]);

  // Auto-start
  useEffect(() => {
    if (autoStart) void startStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return {
    status,
    stream: streamRef.current,
    error,
    startStream,
    stopStream,
    restartStream,
  };
}
