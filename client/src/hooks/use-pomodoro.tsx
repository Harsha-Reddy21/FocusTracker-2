import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TimerSetting, Session } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export type TimerState = "stopped" | "running" | "paused";
export type TimerMode = "work" | "shortBreak" | "longBreak";

export function usePomodoro() {
  const { toast } = useToast();
  const [timerState, setTimerState] = useState<TimerState>("stopped");
  const [timerMode, setTimerMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(25 * 60); // Default 25 minutes in seconds
  const [totalTime, setTotalTime] = useState(25 * 60); // Total time for the current interval
  const [currentSession, setCurrentSession] = useState(1);
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [sessionName, setSessionName] = useState("Focus Session");
  
  const timerRef = useRef<number | null>(null);
  const activeSessionRef = useRef<Session | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const elapsedTimeRef = useRef<number>(0);

  // Get timer settings from the server
  const { data: timerSettings, isLoading: isLoadingSettings } = useQuery<TimerSetting>({
    queryKey: ["/api/timer-settings"],
  });

  // Create a new session
  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: { name: string }) => {
      const res = await apiRequest("POST", "/api/sessions", {
        name: sessionData.name,
        startTime: new Date().toISOString()
      });
      return await res.json();
    },
    onSuccess: (data: Session) => {
      activeSessionRef.current = data;
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create session: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update a session
  const updateSessionMutation = useMutation({
    mutationFn: async (data: { 
      id: number;
      endTime?: string;
      pomodorosCompleted?: number;
      totalFocusTime?: number;
      isCompleted?: boolean;
      isInterrupted?: boolean;
      interruptionReason?: string;
    }) => {
      const { id, ...updateData } = data;
      const res = await apiRequest("PUT", `/api/sessions/${id}`, updateData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update session: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Initialize the timer based on settings
  useEffect(() => {
    if (timerSettings && timerState === "stopped") {
      if (timerMode === "work") {
        setTimeLeft(timerSettings.workDuration * 60);
        setTotalTime(timerSettings.workDuration * 60);
      } else if (timerMode === "shortBreak") {
        setTimeLeft(timerSettings.shortBreakDuration * 60);
        setTotalTime(timerSettings.shortBreakDuration * 60);
      } else if (timerMode === "longBreak") {
        setTimeLeft(timerSettings.longBreakDuration * 60);
        setTotalTime(timerSettings.longBreakDuration * 60);
      }
    }
  }, [timerSettings, timerMode, timerState]);

  // Update timer every second
  useEffect(() => {
    if (timerState === "running") {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer completed
            clearInterval(timerRef.current!);
            
            // Play sound if enabled
            if (timerSettings?.soundEnabled) {
              const audio = new Audio("/timer-completed.mp3");
              audio.volume = timerSettings.soundVolume / 100;
              audio.play().catch((e) => console.error("Error playing sound:", e));
            }
            
            // Show notification if enabled
            if (timerSettings?.notificationsEnabled) {
              if (Notification.permission === "granted") {
                new Notification("FocusFlow Timer", { 
                  body: timerMode === "work" 
                    ? "Work session completed! Time for a break." 
                    : "Break time is over. Ready to focus again?"
                });
              }
            }
            
            // Handle completion based on current mode
            if (timerMode === "work") {
              // Increment completed pomodoros
              const newPomodorosCompleted = pomodorosCompleted + 1;
              setPomodorosCompleted(newPomodorosCompleted);
              
              // Update the active session
              if (activeSessionRef.current) {
                updateSessionMutation.mutate({
                  id: activeSessionRef.current.id,
                  pomodorosCompleted: newPomodorosCompleted,
                  totalFocusTime: totalFocusTime + totalTime
                });
              }
              
              // Move to appropriate break type
              if (currentSession % (timerSettings?.longBreakInterval || 4) === 0) {
                setTimerMode("longBreak");
                setTimeLeft(timerSettings?.longBreakDuration ? timerSettings.longBreakDuration * 60 : 15 * 60);
                setTotalTime(timerSettings?.longBreakDuration ? timerSettings.longBreakDuration * 60 : 15 * 60);
              } else {
                setTimerMode("shortBreak");
                setTimeLeft(timerSettings?.shortBreakDuration ? timerSettings.shortBreakDuration * 60 : 5 * 60);
                setTotalTime(timerSettings?.shortBreakDuration ? timerSettings.shortBreakDuration * 60 : 5 * 60);
              }
            } else {
              // After a break, move to work mode and increment session counter
              setTimerMode("work");
              setCurrentSession((prev) => prev + 1);
              setTimeLeft(timerSettings?.workDuration ? timerSettings.workDuration * 60 : 25 * 60);
              setTotalTime(timerSettings?.workDuration ? timerSettings.workDuration * 60 : 25 * 60);
            }
            
            // Auto start the next interval
            return 0;
          }
          return prev - 1;
        });
        
        // Track total focus time but only during work sessions
        if (timerMode === "work") {
          setTotalFocusTime((prev) => prev + 1);
          elapsedTimeRef.current += 1;
        }
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerState, timerMode, timerSettings, pomodorosCompleted, currentSession, totalTime, totalFocusTime, updateSessionMutation]);

  // Request notification permission
  useEffect(() => {
    if (timerSettings?.notificationsEnabled && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, [timerSettings]);

  const startTimer = useCallback(() => {
    if (timerState === "stopped") {
      // Create a new session
      createSessionMutation.mutate({ name: sessionName });
      startTimeRef.current = new Date();
      elapsedTimeRef.current = 0;
    }
    
    setTimerState("running");
  }, [timerState, sessionName, createSessionMutation]);

  const pauseTimer = useCallback(() => {
    setTimerState("paused");
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Reset the timer to the initial state
    setTimerState("stopped");
    setTimerMode("work");
    setTimeLeft(timerSettings?.workDuration ? timerSettings.workDuration * 60 : 25 * 60);
    setTotalTime(timerSettings?.workDuration ? timerSettings.workDuration * 60 : 25 * 60);
    setCurrentSession(1);
    
    // If we have an active session, mark it as complete or interrupted
    if (activeSessionRef.current) {
      updateSessionMutation.mutate({
        id: activeSessionRef.current.id,
        endTime: new Date().toISOString(),
        pomodorosCompleted,
        totalFocusTime: elapsedTimeRef.current,
        isCompleted: false,
        isInterrupted: true
      });
      
      activeSessionRef.current = null;
      startTimeRef.current = null;
      elapsedTimeRef.current = 0;
    }
  }, [timerSettings, pomodorosCompleted, updateSessionMutation]);

  const skipInterval = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (timerMode === "work") {
      // Complete the current work session
      const newPomodorosCompleted = pomodorosCompleted + 1;
      setPomodorosCompleted(newPomodorosCompleted);
      
      // Update the active session
      if (activeSessionRef.current) {
        updateSessionMutation.mutate({
          id: activeSessionRef.current.id,
          pomodorosCompleted: newPomodorosCompleted,
          totalFocusTime: totalFocusTime + (totalTime - timeLeft) // Add the elapsed time of this pomodoro
        });
      }
      
      // Determine break type
      if (currentSession % (timerSettings?.longBreakInterval || 4) === 0) {
        setTimerMode("longBreak");
        setTimeLeft(timerSettings?.longBreakDuration ? timerSettings.longBreakDuration * 60 : 15 * 60);
        setTotalTime(timerSettings?.longBreakDuration ? timerSettings.longBreakDuration * 60 : 15 * 60);
      } else {
        setTimerMode("shortBreak");
        setTimeLeft(timerSettings?.shortBreakDuration ? timerSettings.shortBreakDuration * 60 : 5 * 60);
        setTotalTime(timerSettings?.shortBreakDuration ? timerSettings.shortBreakDuration * 60 : 5 * 60);
      }
    } else {
      // Skip break, start new work session
      setTimerMode("work");
      setCurrentSession((prev) => prev + 1);
      setTimeLeft(timerSettings?.workDuration ? timerSettings.workDuration * 60 : 25 * 60);
      setTotalTime(timerSettings?.workDuration ? timerSettings.workDuration * 60 : 25 * 60);
    }
    
    // Resume timer state if it was running
    if (timerState === "running") {
      startTimer();
    }
  }, [timerMode, timerState, currentSession, timerSettings, pomodorosCompleted, totalFocusTime, totalTime, timeLeft, startTimer, updateSessionMutation]);

  const completeSession = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setTimerState("stopped");
    
    // Complete the session
    if (activeSessionRef.current) {
      updateSessionMutation.mutate({
        id: activeSessionRef.current.id,
        endTime: new Date().toISOString(),
        pomodorosCompleted,
        totalFocusTime: elapsedTimeRef.current,
        isCompleted: true,
        isInterrupted: false
      });
      
      activeSessionRef.current = null;
      startTimeRef.current = null;
      elapsedTimeRef.current = 0;
    }
    
    // Reset timer
    setTimerMode("work");
    setTimeLeft(timerSettings?.workDuration ? timerSettings.workDuration * 60 : 25 * 60);
    setTotalTime(timerSettings?.workDuration ? timerSettings.workDuration * 60 : 25 * 60);
    setCurrentSession(1);
    setPomodorosCompleted(0);
    setTotalFocusTime(0);
    
    toast({
      title: "Session completed",
      description: `Great job! You completed ${pomodorosCompleted} pomodoros.`
    });
  }, [timerSettings, pomodorosCompleted, updateSessionMutation, toast]);

  const abortSession = useCallback((reason: string) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setTimerState("stopped");
    
    // Mark session as interrupted
    if (activeSessionRef.current) {
      updateSessionMutation.mutate({
        id: activeSessionRef.current.id,
        endTime: new Date().toISOString(),
        pomodorosCompleted,
        totalFocusTime: elapsedTimeRef.current,
        isCompleted: false,
        isInterrupted: true,
        interruptionReason: reason
      });
      
      activeSessionRef.current = null;
      startTimeRef.current = null;
      elapsedTimeRef.current = 0;
    }
    
    // Reset timer
    setTimerMode("work");
    setTimeLeft(timerSettings?.workDuration ? timerSettings.workDuration * 60 : 25 * 60);
    setTotalTime(timerSettings?.workDuration ? timerSettings.workDuration * 60 : 25 * 60);
    setCurrentSession(1);
    setPomodorosCompleted(0);
    setTotalFocusTime(0);
    
    toast({
      title: "Session aborted",
      description: `Session ended with ${pomodorosCompleted} pomodoros completed.`,
      variant: "destructive"
    });
  }, [timerSettings, pomodorosCompleted, updateSessionMutation, toast]);

  return {
    timerState,
    timerMode,
    timeLeft,
    totalTime,
    currentSession,
    pomodorosCompleted,
    totalFocusTime,
    sessionName,
    setSessionName,
    isLoadingSettings,
    timerSettings,
    startTimer,
    pauseTimer,
    resetTimer,
    skipInterval,
    completeSession,
    abortSession,
  };
}
