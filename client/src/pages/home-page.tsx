import { useState } from "react";
import { Layout } from "@/components/layout";
import { PomodoroTimer } from "@/components/pomodoro-timer";
import { BlockListManager } from "@/components/block-list-manager";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { TimerSettings } from "@/components/timer-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<string>("blocklist");

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Focus Timer</h2>
          <p className="text-muted-foreground">Set your timer, manage your blocklist, and track your productivity</p>
        </div>

        <div className="mb-12 bg-card rounded-xl shadow-sm p-6 md:p-8">
          <PomodoroTimer />
        </div>

        <div className="mb-6 border-b">
          <Tabs defaultValue="blocklist" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-0 bg-transparent border-b-0">
              <TabsTrigger value="blocklist" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
                Distraction Blocklist
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none">
                Settings
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div>
          {activeTab === "blocklist" && <BlockListManager />}
          {activeTab === "analytics" && <AnalyticsDashboard />}
          {activeTab === "settings" && <TimerSettings />}
        </div>
      </div>
    </Layout>
  );
}
