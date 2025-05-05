import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipForward, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { usePomodoro } from "@/hooks/use-pomodoro";
import { AbortSessionDialog } from "@/components/abort-session-dialog";
import { cn } from "@/lib/utils";

export function PomodoroTimer() {
  const {
    timerState,
    timerMode,
    timeLeft,
    totalTime,
    currentSession,
    pomodorosCompleted,
    sessionName,
    setSessionName,
    timerSettings,
    startTimer,
    pauseTimer,
    resetTimer,
    skipInterval,
    abortSession,
  } = usePomodoro();

  const [isAbortDialogOpen, setIsAbortDialogOpen] = useState(false);
  const svgRef = useRef<SVGCircleElement>(null);
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Get status text based on timer mode and current session
  const getStatusText = () => {
    if (timerMode === "work") {
      const longBreakInterval = timerSettings?.longBreakInterval || 4;
      return `Work Session - ${currentSession}/${longBreakInterval}`;
    } else if (timerMode === "shortBreak") {
      return "Short Break";
    } else {
      return "Long Break";
    }
  };

  // Update progress ring
  useEffect(() => {
    if (svgRef.current) {
      const progress = 1 - (timeLeft / totalTime);
      const dashoffset = circumference * progress;
      svgRef.current.style.strokeDasharray = circumference.toString();
      svgRef.current.style.strokeDashoffset = dashoffset.toString();
    }
  }, [timeLeft, totalTime, circumference]);

  const handleStartPause = () => {
    if (timerState === "running") {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  const handleReset = () => {
    // If timer is running, open the abort dialog
    if (timerState === "running" || timerState === "paused") {
      setIsAbortDialogOpen(true);
    } else {
      resetTimer();
    }
  };

  const handleAbort = (reason: string) => {
    abortSession(reason);
    setIsAbortDialogOpen(false);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <h3 className="text-xl font-semibold mb-4 md:mb-0">Current Session</h3>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings-2">
              <path d="M20 7h-9"></path>
              <path d="M14 17H5"></path>
              <circle cx="17" cy="17" r="3"></circle>
              <circle cx="7" cy="7" r="3"></circle>
            </svg>
          </Button>
          <div>
            <Select
              value={sessionName}
              onValueChange={setSessionName}
            >
              <SelectTrigger className="bg-muted/50 border-0">
                <SelectValue placeholder="Deep Work" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Deep Work">Deep Work</SelectItem>
                <SelectItem value="Quick Task">Quick Task</SelectItem>
                <SelectItem value="Project Planning">Project Planning</SelectItem>
                <SelectItem value="Reading">Reading</SelectItem>
                <SelectItem value="Custom">+ Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* SVG Progress Ring */}
          <svg className="absolute" width="264" height="264">
            <circle 
              cx="132" 
              cy="132" 
              r={radius} 
              fill="none" 
              stroke="hsl(var(--border))" 
              strokeWidth="8" 
            />
            <circle 
              ref={svgRef}
              className="transition-all duration-300 ease-linear"
              cx="132" 
              cy="132" 
              r={radius} 
              fill="none" 
              stroke="hsl(var(--primary))" 
              strokeWidth="8" 
              style={{
                transformOrigin: "center",
                transform: "rotate(-90deg)",
                strokeDasharray: circumference.toString(),
                strokeDashoffset: "0",
              }}
            />
          </svg>

          {/* Timer Text */}
          <div className="text-center z-10">
            <div className="font-mono text-5xl font-semibold mb-2">{formatTime(timeLeft)}</div>
            <div className="text-sm text-muted-foreground">{getStatusText()}</div>
          </div>
        </div>

        <div className="flex items-center space-x-4 mt-8">
          <Button 
            onClick={skipInterval} 
            variant="ghost" 
            size="icon" 
            className="rounded-full h-12 w-12"
          >
            <SkipForward className="h-6 w-6" />
          </Button>
          
          <Button 
            onClick={handleStartPause} 
            variant="default" 
            className="px-6 py-3 h-12 rounded-full"
          >
            {timerState === "running" ? (
              <>
                <Pause className="h-5 w-5 mr-2" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                <span>{timerState === "paused" ? "Resume" : "Start"}</span>
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleReset} 
            variant="ghost" 
            size="icon" 
            className="rounded-full h-12 w-12"
          >
            <RotateCcw className="h-6 w-6" />
          </Button>
        </div>

        <div className="mt-8 text-center">
          <div className="text-sm text-muted-foreground">
            Today's Progress: {pomodorosCompleted} of 8 pomodoros completed
          </div>
          <div className="flex items-center justify-center space-x-1 mt-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <span 
                key={i} 
                className={cn(
                  "h-2 w-8 rounded-full", 
                  i < pomodorosCompleted ? "bg-primary" : "bg-muted"
                )}
              ></span>
            ))}
          </div>
        </div>
      </div>

      <AbortSessionDialog 
        open={isAbortDialogOpen}
        onClose={() => setIsAbortDialogOpen(false)}
        onAbort={handleAbort}
      />
    </>
  );
}
