import { useEffect, useRef, useState, useCallback } from 'react';

interface IdleTimerOptions {
  timeoutMinutes: number;
  onTimeout: () => void;
  warningSeconds?: number;
  enabled?: boolean;
}

export function useIdleTimer({
  timeoutMinutes,
  onTimeout,
  warningSeconds = 30,
  enabled = true,
}: IdleTimerOptions) {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(warningSeconds);
  const lastActivityRef = useRef(Date.now());
  const timerRef = useRef<any>(null);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    setSecondsRemaining(warningSeconds);
  }, [warningSeconds]);

  useEffect(() => {
    if (!enabled) {
      setShowWarning(false);
      return;
    }

    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'click'];

    const handleUserActivity = () => {
      // If warning is not active, reset timestamp quietly
      if (!showWarning) {
        lastActivityRef.current = Date.now();
      }
    };

    activityEvents.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));

    const intervalMs = 1000;
    timerRef.current = setInterval(() => {
      const elapsedMs = Date.now() - lastActivityRef.current;
      const totalTimeoutMs = timeoutMinutes * 60 * 1000;
      const warningThresholdMs = totalTimeoutMs - warningSeconds * 1000;

      if (elapsedMs >= totalTimeoutMs) {
        setShowWarning(false);
        onTimeout();
      } else if (elapsedMs >= warningThresholdMs) {
        setShowWarning(true);
        const rem = Math.max(1, Math.round((totalTimeoutMs - elapsedMs) / 1000));
        setSecondsRemaining(rem);
      } else {
        setShowWarning(false);
      }
    }, intervalMs);

    return () => {
      activityEvents.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeoutMinutes, warningSeconds, onTimeout, showWarning, enabled]);

  return {
    showWarning,
    secondsRemaining,
    resetTimer,
  };
}
