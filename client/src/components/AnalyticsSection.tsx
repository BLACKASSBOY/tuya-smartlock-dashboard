import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Calendar } from "lucide-react";

export default function AnalyticsSection() {
  const [timeRange, setTimeRange] = useState<"hourly" | "daily" | "weekly">("daily");

  const activityLogsQuery = trpc.smartlock.getActivityLogs.useQuery({});
  const logs = activityLogsQuery.data?.data || [];

  // Aggregate unlock data based on time range
  const chartData = useMemo(() => {
    if (logs.length === 0) return [];

    const aggregated: Record<string, number> = {};

    logs.forEach((log) => {
      if (log.eventType !== "unlock" || !log.eventTime) return;

      const date = new Date(log.eventTime);
      let key = "";

      if (timeRange === "hourly") {
        const hour = date.getHours();
        key = `${hour}:00`;
      } else if (timeRange === "daily") {
        const day = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        key = day;
      } else {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `Week of ${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      }

      aggregated[key] = (aggregated[key] || 0) + 1;
    });

    return Object.entries(aggregated).map(([name, value]) => ({
      name,
      unlocks: value,
    }));
  }, [logs, timeRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const unlocks = logs.filter((l) => l.eventType === "unlock").length;
    const locks = logs.filter((l) => l.eventType === "lock").length;
    const alarms = logs.filter((l) => l.eventType === "alarm").length;

    return { unlocks, locks, alarms };
  }, [logs]);

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Unlocks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unlocks}</div>
            <p className="text-xs text-muted-foreground mt-1">in activity history</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Locks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.locks}</div>
            <p className="text-xs text-muted-foreground mt-1">in activity history</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alarms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.alarms}</div>
            <p className="text-xs text-muted-foreground mt-1">in activity history</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Unlock Frequency</CardTitle>
            <CardDescription>Unlock activity over time</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={timeRange === "hourly" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("hourly")}
            >
              Hourly
            </Button>
            <Button
              variant={timeRange === "daily" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("daily")}
            >
              Daily
            </Button>
            <Button
              variant={timeRange === "weekly" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("weekly")}
            >
              Weekly
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No unlock data available</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                <XAxis dataKey="name" stroke="currentColor" opacity={0.7} />
                <YAxis stroke="currentColor" opacity={0.7} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                  }}
                  labelStyle={{ color: "var(--foreground)" }}
                />
                <Legend />
                <Bar dataKey="unlocks" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
