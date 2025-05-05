import { useQuery } from "@tanstack/react-query";
import { Session } from "@shared/schema";
import { Clock, CheckCircle, Activity, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FocusAnalyticsChart } from "@/components/focus-analytics-chart";
import { format, formatDistance } from "date-fns";

export function AnalyticsDashboard() {
  // Get sessions and stats
  const { data: sessions, isLoading: isLoadingSessions } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/sessions/stats"],
  });

  // Helper functions
  const formatHoursMinutes = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatCompletionRate = () => {
    if (!stats) return "0%";
    const { totalSessions, completedSessions } = stats;
    if (totalSessions === 0) return "0%";
    return `${Math.round((completedSessions / totalSessions) * 100)}%`;
  };

  // Calculate current streak
  const calculateStreak = () => {
    if (!sessions || sessions.length === 0) return 0;
    
    let currentStreak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    const sessionsByDate = new Map<string, boolean>();
    
    // Group sessions by date
    sessions.forEach(session => {
      const sessionDate = new Date(session.startTime);
      sessionDate.setHours(0, 0, 0, 0);
      const dateKey = sessionDate.toISOString().split('T')[0];
      
      if (!sessionsByDate.has(dateKey)) {
        sessionsByDate.set(dateKey, true);
      }
    });
    
    // Count streak days
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(currentDate);
      checkDate.setDate(checkDate.getDate() - i);
      const dateKey = checkDate.toISOString().split('T')[0];
      
      if (sessionsByDate.has(dateKey)) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    return currentStreak;
  };

  return (
    <div className="bg-card rounded-xl shadow-sm p-6 md:p-8">
      <h3 className="text-lg font-semibold mb-6">Your Focus Analytics</h3>
      
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Focus Time */}
        <Card className="bg-muted/20 border-0">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Focus Time</p>
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold mt-1">
                    {formatHoursMinutes(stats?.totalFocusTime || 0)}
                  </p>
                )}
              </div>
              <div className="bg-primary/10 p-2 rounded">
                <Clock className="text-primary h-5 w-5" />
              </div>
            </div>
            {isLoadingStats ? (
              <Skeleton className="h-4 w-32 mt-2" />
            ) : (
              stats?.totalFocusTime && stats.totalFocusTime > 0 && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center">
                  <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 10 7-7 7 7"></path>
                    <path d="M19 14v6"></path>
                    <path d="M12 3v12"></path>
                    <path d="M5 21v-7"></path>
                  </svg>
                  <span>12% increase this week</span>
                </div>
              )
            )}
          </CardContent>
        </Card>
        
        {/* Completed Pomodoros */}
        <Card className="bg-muted/20 border-0">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Completed Pomodoros</p>
                {isLoadingSessions ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold mt-1">
                    {sessions?.reduce((sum, session) => sum + session.pomodorosCompleted, 0) || 0}
                  </p>
                )}
              </div>
              <div className="bg-emerald-500/10 p-2 rounded">
                <CheckCircle className="text-emerald-500 h-5 w-5" />
              </div>
            </div>
            {isLoadingSessions ? (
              <Skeleton className="h-4 w-32 mt-2" />
            ) : (
              sessions && sessions.length > 0 && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center">
                  <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 10 7-7 7 7"></path>
                    <path d="M19 14v6"></path>
                    <path d="M12 3v12"></path>
                    <path d="M5 21v-7"></path>
                  </svg>
                  <span>8 more than last week</span>
                </div>
              )
            )}
          </CardContent>
        </Card>
        
        {/* Completion Rate */}
        <Card className="bg-muted/20 border-0">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Completion Rate</p>
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold mt-1">{formatCompletionRate()}</p>
                )}
              </div>
              <div className="bg-amber-500/10 p-2 rounded">
                <Activity className="text-amber-500 h-5 w-5" />
              </div>
            </div>
            {isLoadingStats ? (
              <Skeleton className="h-4 w-32 mt-2" />
            ) : (
              <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center">
                <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 10 7-7 7 7"></path>
                  <path d="M19 14v6"></path>
                  <path d="M12 3v12"></path>
                  <path d="M5 21v-7"></path>
                </svg>
                <span>4% better than average</span>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Focus Streak */}
        <Card className="bg-muted/20 border-0">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Focus Streak</p>
                {isLoadingSessions ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold mt-1">
                    {calculateStreak()} {calculateStreak() === 1 ? 'day' : 'days'}
                  </p>
                )}
              </div>
              <div className="bg-red-500/10 p-2 rounded">
                <Flame className="text-red-500 h-5 w-5" />
              </div>
            </div>
            {isLoadingSessions ? (
              <Skeleton className="h-4 w-20 mt-2" />
            ) : (
              <div className="text-xs text-muted-foreground mt-2 flex items-center">
                <span>Best: 8 days</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium">Weekly Focus Summary</h4>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="text-sm">Day</Button>
            <Button variant="default" size="sm" className="text-sm bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary">Week</Button>
            <Button variant="outline" size="sm" className="text-sm">Month</Button>
          </div>
        </div>
        
        <FocusAnalyticsChart />
      </div>
      
      <div>
        <h4 className="font-medium mb-4">Recent Sessions</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Task</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Pomodoros</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingSessions ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Skeleton className="h-4 w-8" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                  </tr>
                ))
              ) : (
                sessions && sessions.length > 0 ? (
                  sessions.slice(0, 5).map((session) => (
                    <tr key={session.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {session.startTime ? (
                          <>
                            {format(new Date(session.startTime), "MMM d, h:mm a")}
                          </>
                        ) : "N/A"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{session.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {formatHoursMinutes(session.totalFocusTime)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{session.pomodorosCompleted}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {session.isCompleted ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200">
                            Completed
                          </span>
                        ) : session.isInterrupted ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200">
                            Interrupted
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                            In Progress
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No sessions recorded yet. Start a focus timer to begin tracking your productivity!
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
