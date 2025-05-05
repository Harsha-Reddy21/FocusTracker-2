import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function FocusAnalyticsChart() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/sessions/stats"],
  });

  const formatChartData = () => {
    if (!stats) return [];

    const today = new Date();
    const dateRange = eachDayOfInterval({
      start: subDays(today, 6),
      end: today
    });

    // Format weekly data
    return dateRange.map((date, index) => {
      const dayName = format(date, "EEE");
      const seconds = stats.weeklyFocusTime[index] || 0;
      const hours = seconds / 3600; // Convert seconds to hours
      
      return {
        day: dayName,
        focusHours: parseFloat(hours.toFixed(1)),
        date: format(date, "MMM d")
      };
    });
  };

  const chartData = formatChartData();

  if (isLoading) {
    return (
      <Card className="w-full h-64 flex items-center justify-center p-4">
        <Skeleton className="w-full h-full rounded-lg" />
      </Card>
    );
  }

  return (
    <Card className="border bg-card">
      <div className="p-1 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              label={{ 
                value: 'Hours', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' },
                fontSize: 12,
                dx: -20
              }}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                color: 'hsl(var(--foreground))'
              }}
              formatter={(value: number) => [`${value} hours`, 'Focus Time']}
              labelFormatter={(label) => {
                const item = chartData.find(d => d.day === label);
                return item ? item.date : label;
              }}
            />
            <Bar 
              dataKey="focusHours" 
              name="Focus Time" 
              fill="hsl(var(--primary))" 
              radius={[4, 4, 0, 0]}
              barSize={30} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
