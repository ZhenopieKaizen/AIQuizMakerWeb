import React, { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';

interface QuizTimerProps {
  totalSeconds: number;
  onTimeUpdate: (elapsedSeconds: number) => void;
  onTimeExpired: () => void;
  isPaused: boolean;
}

export const QuizTimer: React.FC<QuizTimerProps> = ({
  totalSeconds,
  onTimeUpdate,
  onTimeExpired,
  isPaused,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onTimeExpiredRef = useRef(onTimeExpired);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
    onTimeExpiredRef.current = onTimeExpired;
  }, [onTimeExpired, onTimeUpdate]);

  useEffect(() => {
    setRemainingSeconds(totalSeconds);
    hasExpiredRef.current = false;
  }, [totalSeconds]);

  useEffect(() => {
    if (isPaused || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, remainingSeconds]);

  useEffect(() => {
    onTimeUpdateRef.current(Math.max(0, totalSeconds - remainingSeconds));

    if (remainingSeconds === 0 && !hasExpiredRef.current) {
      hasExpiredRef.current = true;
      onTimeExpiredRef.current();
    }
  }, [remainingSeconds, totalSeconds]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const percentageRemaining = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const isCritical = percentageRemaining <= 0.1;
  const isWarning = !isCritical && percentageRemaining <= 0.25;

  const colorClasses = isCritical
    ? 'border-rose-500/60 bg-rose-950/60 text-rose-200'
    : isWarning
      ? 'border-amber-500/50 bg-amber-950/50 text-amber-200'
      : 'border-slate-800 bg-slate-900 text-slate-300';

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-colors ${colorClasses} ${
        isCritical ? 'animate-pulse' : ''
      }`}
      role="timer"
      aria-label={`${minutes} minutes and ${seconds} seconds remaining`}
    >
      <Clock className={`w-3.5 h-3.5 ${isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-indigo-400'}`} />
      <span className="hidden sm:inline font-sans font-semibold">Time left</span>
      <span className="font-bold tabular-nums">
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
};
