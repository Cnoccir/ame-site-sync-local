import { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface AssessmentTimerProps {
  isRunning: boolean;
  onTimeWarning?: () => void;
  onTimeUp?: () => void;
}

export const AssessmentTimer = ({ isRunning, onTimeWarning, onTimeUp }: AssessmentTimerProps) => {
  const [timeElapsed, setTimeElapsed] = useState(0); // in seconds
  const totalTime = 30 * 60; // 30 minutes in seconds

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        setTimeElapsed(prev => {
          const newTime = prev + 1;
          
          // Warning at 25 minutes (1500 seconds)
          if (newTime === 25 * 60 && onTimeWarning) {
            onTimeWarning();
          }
          
          // Time up at 30 minutes
          if (newTime >= totalTime && onTimeUp) {
            onTimeUp();
          }
          
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, onTimeWarning, onTimeUp, totalTime]);

  const remainingTime = Math.max(0, totalTime - timeElapsed);
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  const progressPercentage = (timeElapsed / totalTime) * 100;

  const isWarning = timeElapsed >= 25 * 60;
  const isOvertime = timeElapsed >= totalTime;

  return (
    <Card className="p-4 border-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <span className="font-medium">Assessment Timer</span>
        </div>
        {isWarning && (
          <AlertTriangle className={`w-5 h-5 ${isOvertime ? 'text-destructive' : 'text-warning'}`} />
        )}
      </div>
      
      <div className="text-center mb-3">
        <div className={`text-3xl font-bold ${isOvertime ? 'text-destructive' : isWarning ? 'text-warning' : 'text-primary'}`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        <div className="text-sm text-muted-foreground">
          {isOvertime ? 'Time exceeded' : 'Remaining'}
        </div>
      </div>
      
      <Progress 
        value={Math.min(100, progressPercentage)} 
        className="h-2"
      />
      
      <div className="text-xs text-muted-foreground text-center mt-2">
        Target: 30 minutes
      </div>
    </Card>
  );
};