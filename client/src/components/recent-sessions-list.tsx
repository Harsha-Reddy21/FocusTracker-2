import { useQuery } from "@tanstack/react-query";
import { Session } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function RecentSessionsList() {
  const { data: sessions, isLoading } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
  });

  const formatRelativeTime = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  return (
    <div className="mt-8 pt-6 border-t dark:border-neutral-700">
      <h3 className="text-xs font-medium uppercase text-muted-foreground tracking-wider">Recent Sessions</h3>
      
      {isLoading ? (
        <div className="mt-3 space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="py-2">
              <div className="flex items-center justify-between mb-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-3 w-36" />
            </div>
          ))}
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {sessions && sessions.length > 0 ? (
            sessions.slice(0, 3).map((session) => (
              <li key={session.id}>
                <div className="block py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{session.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(session.startTime)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      {session.pomodorosCompleted} {session.pomodorosCompleted === 1 ? 'pomodoro' : 'pomodoros'} - {formatDuration(session.totalFocusTime)}
                    </span>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="py-2 text-sm text-muted-foreground">
              No recent sessions yet. Start a timer to create your first session!
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
