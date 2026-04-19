import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function useGlobalHotkeys() {
  const lockMutation = trpc.smartlock.lockDoor.useMutation();
  const unlockMutation = trpc.smartlock.unlockDoor.useMutation();

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      // Check if Ctrl key is pressed
      if (!event.ctrlKey) return;

      // Ctrl+L to lock
      if (event.key.toLowerCase() === "l") {
        event.preventDefault();
        try {
          const result = await lockMutation.mutateAsync();
          if (result.success) {
            toast.success("Door locked", {
              description: "Locked via hotkey (Ctrl+L)",
              duration: 2000,
            });
          } else {
            toast.error("Failed to lock door");
          }
        } catch (error) {
          toast.error("Error locking door");
        }
      }

      // Ctrl+U to unlock
      if (event.key.toLowerCase() === "u") {
        event.preventDefault();
        try {
          const result = await unlockMutation.mutateAsync();
          if (result.success) {
            toast.success("Door unlocked", {
              description: "Unlocked via hotkey (Ctrl+U)",
              duration: 2000,
            });
          } else {
            toast.error("Failed to unlock door");
          }
        } catch (error) {
          toast.error("Error unlocking door");
        }
      }
    };

    // Add global keydown listener
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
}
