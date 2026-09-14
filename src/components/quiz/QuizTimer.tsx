import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface QuizTimerProps {
  onTimeUpdate: (seconds: number) => void;
  isPaused: boolean;
}

export const QuizTimer: React.FC<QuizTimerProps> = ({ onTimeUpdate, isPaused }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (!isPaused) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          onTimeUpdate(next);
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPaused, onTimeUpdate]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
      <Clock className="w-3.5 h-3.5 text-indigo-400" />
      <span>{formatTime(seconds)}</span>
    </div>
  );
};
