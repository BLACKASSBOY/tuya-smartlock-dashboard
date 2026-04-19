import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Unlock, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function ActivityLogSection() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activityLogsQuery = trpc.smartlock.getActivityLogs.useQuery({});
  const syncMutation = trpc.smartlock.syncActivityLogs.useMutation();

  const handleSync = async () => {
    setIsRefreshing(true);
    try {
      const result = await syncMutation.mutateAsync();
      if (result.success) {
        toast.success("Activity logs synced");
        activityLogsQuery.refetch();
      } else {
        toast.error(result.error || "Failed to sync logs");
      }
    } catch (error) {
      toast.error("Error syncing activity logs");
    } finally {
      setIsRefreshing(false);
    }
  };

  const logs = activityLogsQuery.data?.data || [];

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "unlock":
        return <Unlock className="w-4 h-4 text-green-500" />;
      case "lock":
        return <Unlock className="w-4 h-4 text-blue-500" />;
      case "alarm":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Unlock className="w-4 h-4" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "unlock":
        return "text-green-600";
      case "lock":
        return "text-blue-600";
      case "alarm":
        return "text-orange-600";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>Lock and unlock history</CardDescription>
          </div>
          <Button
            onClick={handleSync}
            disabled={isRefreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Sync
          </Button>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No activity logs yet. Lock or unlock your door to see activity.
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getEventIcon(log.eventType || "")}
                    <div>
                      <p className={`font-medium ${getEventColor(log.eventType || "")}`}>
                        {log.eventName || "Activity"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {log.operateName && `by ${log.operateName}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {log.eventTime
                        ? new Date(log.eventTime).toLocaleTimeString()
                        : "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.eventTime
                        ? new Date(log.eventTime).toLocaleDateString()
                        : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
