import { Layout } from "@/components/layout";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";

export default function AnalyticsPage() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Focus Analytics</h2>
          <p className="text-muted-foreground">Track your productivity and focus habits over time</p>
        </div>

        <AnalyticsDashboard />
      </div>
    </Layout>
  );
}
