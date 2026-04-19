import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, Battery } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function LockControlSection() {
  const [isLoading, setIsLoading] = useState(false);
  const [lockStatus, setLockStatus] = useState<{
    locked: boolean;
    battery_level: number;
  } | null>(null);

  const getLockStatusQuery = trpc.smartlock.getLockStatus.useQuery(undefined, {
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const lockMutation = trpc.smartlock.lockDoor.useMutation();
  const unlockMutation = trpc.smartlock.unlockDoor.useMutation();

  useEffect(() => {
    if (getLockStatusQuery.data?.success && getLockStatusQuery.data.data) {
      setLockStatus(getLockStatusQuery.data.data);
    }
  }, [getLockStatusQuery.data]);

  const handleLock = async () => {
    setIsLoading(true);
    try {
      const result = await lockMutation.mutateAsync();
      if (result.success) {
        toast.success("Door locked successfully");
        setLockStatus((prev) => prev ? { ...prev, locked: true } : null);
      } else {
        toast.error(result.error || "Failed to lock door");
      }
    } catch (error) {
      toast.error("Error locking door");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = async () => {
    setIsLoading(true);
    try {
      const result = await unlockMutation.mutateAsync();
      if (result.success) {
        toast.success("Door unlocked successfully");
        setLockStatus((prev) => prev ? { ...prev, locked: false } : null);
      } else {
        toast.error(result.error || "Failed to unlock door");
      }
    } catch (error) {
      toast.error("Error unlocking door");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Lock Status</CardTitle>
          <CardDescription>Current status of your smart lock</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Display */}
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                {lockStatus?.locked ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full"></div>
                    <Lock className="w-24 h-24 text-green-500 relative" />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"></div>
                    <Unlock className="w-24 h-24 text-orange-500 relative" />
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold mb-2">
                {lockStatus?.locked ? "Locked" : "Unlocked"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {lockStatus?.locked
                  ? "Your door is secure"
                  : "Your door is unlocked"}
              </p>

              {/* Battery Level */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <Battery className="w-5 h-5 text-primary" />
                <span className="text-lg font-semibold">
                  {lockStatus?.battery_level || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleLock}
              disabled={isLoading || lockStatus?.locked}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <Lock className="w-4 h-4 mr-2" />
              Lock
            </Button>
            <Button
              onClick={handleUnlock}
              disabled={isLoading || !lockStatus?.locked}
              className="bg-orange-600 hover:bg-orange-700 text-white"
              variant="default"
              size="lg"
            >
              <Unlock className="w-4 h-4 mr-2" />
              Unlock
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Processing...</span>
            </div>
          )}

          {/* Status Info */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated:</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Battery Status:</span>
              <span className={lockStatus && lockStatus.battery_level < 20 ? "text-destructive" : ""}>
                {lockStatus?.battery_level || 0}% - {lockStatus && lockStatus.battery_level > 50 ? "Good" : lockStatus && lockStatus.battery_level > 20 ? "Low" : "Critical"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
