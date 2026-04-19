import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Power } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function SchedulerSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [scheduleName, setScheduleName] = useState("");
  const [lockTime, setLockTime] = useState("22:00");
  const [daysOfWeek, setDaysOfWeek] = useState("0,1,2,3,4,5,6");

  const schedulesQuery = trpc.smartlock.getLockSchedules.useQuery();
  const createScheduleMutation = trpc.smartlock.createLockSchedule.useMutation();
  const deleteScheduleMutation = trpc.smartlock.deleteLockSchedule.useMutation();
  const toggleScheduleMutation = trpc.smartlock.toggleLockSchedule.useMutation();

  const handleCreateSchedule = async () => {
    if (!scheduleName.trim()) {
      toast.error("Please enter a schedule name");
      return;
    }

    try {
      const result = await createScheduleMutation.mutateAsync({
        name: scheduleName,
        lockTime,
        daysOfWeek,
      });

      if (result.success) {
        toast.success("Schedule created successfully");
        setScheduleName("");
        setLockTime("22:00");
        setDaysOfWeek("0,1,2,3,4,5,6");
        setIsDialogOpen(false);
        schedulesQuery.refetch();
      } else {
        toast.error(result.error || "Failed to create schedule");
      }
    } catch (error) {
      toast.error("Error creating schedule");
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    try {
      const result = await deleteScheduleMutation.mutateAsync({ id });
      if (result.success) {
        toast.success("Schedule deleted");
        schedulesQuery.refetch();
      } else {
        toast.error(result.error || "Failed to delete schedule");
      }
    } catch (error) {
      toast.error("Error deleting schedule");
    }
  };

  const handleToggleSchedule = async (id: number, isEnabled: boolean) => {
    try {
      const result = await toggleScheduleMutation.mutateAsync({
        id,
        isEnabled: !isEnabled,
      });

      if (result.success) {
        toast.success(isEnabled ? "Schedule disabled" : "Schedule enabled");
        schedulesQuery.refetch();
      } else {
        toast.error(result.error || "Failed to toggle schedule");
      }
    } catch (error) {
      toast.error("Error toggling schedule");
    }
  };

  const getDayNames = (daysStr: string) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayIndices = daysStr.split(",").map((d) => parseInt(d));
    return dayIndices.map((i) => days[i]).join(", ");
  };

  const schedules = schedulesQuery.data?.data || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Auto-Lock Scheduler</CardTitle>
            <CardDescription>Set automatic lock times</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Schedule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Auto-Lock Schedule</DialogTitle>
                <DialogDescription>
                  Set a time for your door to automatically lock
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="schedule-name">Schedule Name</Label>
                  <Input
                    id="schedule-name"
                    placeholder="e.g., Bedtime, Work Hours"
                    value={scheduleName}
                    onChange={(e) => setScheduleName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lock-time">Lock Time (24h format)</Label>
                  <Input
                    id="lock-time"
                    type="time"
                    value={lockTime}
                    onChange={(e) => setLockTime(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="days">Days (0=Sun, 1=Mon, etc.)</Label>
                  <Input
                    id="days"
                    placeholder="0,1,2,3,4,5,6"
                    value={daysOfWeek}
                    onChange={(e) => setDaysOfWeek(e.target.value)}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Current: {getDayNames(daysOfWeek)}
                  </p>
                </div>
                <Button onClick={handleCreateSchedule} className="w-full">
                  Create Schedule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No schedules yet. Create one to automatically lock your door.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">{schedule.name}</TableCell>
                      <TableCell className="font-mono">{schedule.lockTime}</TableCell>
                      <TableCell className="text-sm">
                        {getDayNames(schedule.daysOfWeek || "")}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            schedule.isEnabled
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          }`}
                        >
                          {schedule.isEnabled ? "Enabled" : "Disabled"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleToggleSchedule(schedule.id, schedule.isEnabled === 1)
                            }
                            title={schedule.isEnabled ? "Disable" : "Enable"}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
