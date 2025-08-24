import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TaskTimerProps {
  startTime: number;
  estimatedDuration: number; // in minutes
}

export const TaskTimer: React.FC<TaskTimerProps> = ({ startTime, estimatedDuration }) => {
  const [elapsed, setElapsed] = useState(0);
  const [isOvertime, setIsOvertime] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - startTime;
      const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
      const elapsedSeconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);
      
      setElapsed(elapsedMinutes * 60 + elapsedSeconds);
      setIsOvertime(elapsedMinutes >= estimatedDuration);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, estimatedDuration]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const elapsedMinutes = Math.floor(elapsed / 60);
  const percentage = Math.min((elapsedMinutes / estimatedDuration) * 100, 100);

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        'flex items-center gap-1 px-2 py-1 rounded text-sm font-medium',
        isOvertime 
          ? 'bg-red-100 text-red-800 border border-red-300' 
          : 'bg-blue-100 text-blue-800 border border-blue-300'
      )}>
        {isOvertime ? (
          <AlertTriangle className="w-3 h-3" />
        ) : (
          <Clock className="w-3 h-3" />
        )}
        <span>{formatTime(elapsed)}</span>
      </div>
      
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>/</span>
        <span>{estimatedDuration}m</span>
        {isOvertime && (
          <Badge variant="destructive" className="text-xs">
            Overtime
          </Badge>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={cn(
            'h-full transition-all duration-300',
            isOvertime ? 'bg-red-500' : 'bg-blue-500'
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};