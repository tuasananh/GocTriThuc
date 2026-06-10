import { useEffect, useState, useRef } from 'react';
import { Clock } from 'lucide-react';

interface TestCountdownProps {
  initialSeconds: number;
  onTimeout: () => void;
}

export function TestCountdown({ initialSeconds, onTimeout }: TestCountdownProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    // If we've already timed out on init
    if (initialSeconds <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSecondsLeft(0);
      onTimeoutRef.current();
      return;
    }

    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (initialSeconds <= 0) return;

    // Calculate absolute end time to prevent drift if browser throttles setInterval
    const endTime = Date.now() + initialSeconds * 1000;

    const interval = setInterval(() => {
      const remaining = Math.round((endTime - Date.now()) / 1000);

      if (remaining <= 0) {
        clearInterval(interval);
        setSecondsLeft(0);
        onTimeoutRef.current();
      } else {
        setSecondsLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [initialSeconds]);

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const formatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  const isWarning = secondsLeft > 0 && secondsLeft <= 300; // < 5 minutes
  const isDanger = secondsLeft > 0 && secondsLeft <= 60; // < 1 minute

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-semibold border shadow-sm transition-colors ${
        isDanger
          ? 'bg-destructive/10 text-destructive border-destructive/20 animate-pulse'
          : isWarning
            ? 'bg-amber-100 text-amber-700 border-amber-200'
            : 'bg-card text-foreground border-border'
      }`}
    >
      <Clock className="w-5 h-5" />
      <span>{formatted}</span>
    </div>
  );
}
