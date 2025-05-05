import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Clock } from "lucide-react";
import { formatTime } from "@/lib/utils";

export function BlockPage() {
  // Since we're no longer using usePomodoro, we'll hardcode some values
  const [timeLeft, setTimeLeft] = useState(1500); // 25 minutes in seconds
  const [blockedSites, setBlockedSites] = useState<string[]>([]);
  const [showWarning, setShowWarning] = useState(true);
  
  // Fetch the blocked sites
  useEffect(() => {
    async function fetchBlockedSites() {
      try {
        const res = await fetch("/api/blocked-sites");
        if (res.ok) {
          const data = await res.json();
          setBlockedSites(data.map((site: any) => site.domain));
        }
      } catch (error) {
        console.error("Failed to fetch blocked sites:", error);
      }
    }
    
    fetchBlockedSites();
  }, []);
  
  if (!showWarning) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-background to-muted flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-card rounded-lg shadow-xl border overflow-hidden">
        <div className="bg-destructive text-destructive-foreground p-4 flex items-center gap-2">
          <AlertTriangle size={20} />
          <h2 className="text-lg font-semibold">Distraction Blocked</h2>
        </div>
        
        <div className="p-6">
          <div className="mb-6 space-y-3">
            <p className="text-foreground">
              You're currently in a focus session. Access to distracting sites is blocked.
            </p>
            
            <div className="bg-muted rounded-md p-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-muted-foreground" />
                <span className="font-medium">
                  Work session in progress
                </span>
              </div>
              <span className="font-mono bg-background px-2 py-1 rounded text-sm">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => setShowWarning(false)}
            >
              <ArrowLeft size={16} className="mr-2" />
              Return to FocusFlow
            </Button>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground mt-4">
                This site is blocked during focus sessions to help you stay productive.
                You can return when your session is complete.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-muted-foreground">
        <p>Currently blocking: </p>
        <div className="flex flex-wrap gap-1 mt-1 justify-center">
          {blockedSites.map(site => (
            <span key={site} className="bg-muted px-2 py-1 rounded text-xs">
              {site}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}