import { useState, useEffect } from "react";
import { Shield, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePomodoro } from "@/hooks/use-pomodoro";
import { formatTime } from "@/lib/utils";

type SiteBlockedOverlayProps = {
  domain: string;
  onClose: () => void;
};

export function SiteBlockedOverlay({ domain, onClose }: SiteBlockedOverlayProps) {
  const { timeLeft, timerMode } = usePomodoro();
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    // Prevent scrolling of the body when overlay is visible
    if (visible) {
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [visible]);
  
  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // match the transition duration
  };
  
  if (!visible) return null;
  
  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-card border shadow-lg rounded-lg p-6 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="flex flex-col items-center text-center mb-6">
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mb-4">
            <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Site Blocked</h2>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">{domain}</span> is blocked during your focus session.
          </p>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
              <span className="text-sm font-medium">{timerMode === "work" ? "Work session" : "Break"} in progress</span>
            </div>
            <div className="text-sm font-mono bg-background px-2 py-1 rounded">
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Button onClick={handleClose} variant="default">
            Return to FocusFlow
          </Button>
          
          <Button variant="outline" onClick={handleClose}>
            Close this message
          </Button>
        </div>
      </div>
    </div>
  );
}