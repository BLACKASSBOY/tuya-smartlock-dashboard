import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Copy, Trash2, Lock, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function CodeManagerSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [codeName, setCodeName] = useState("");
  const [validityDays, setValidityDays] = useState(7);

  const accessCodesQuery = trpc.smartlock.getAccessCodes.useQuery();
  const createCodeMutation = trpc.smartlock.createAccessCode.useMutation();
  const deleteCodeMutation = trpc.smartlock.deleteAccessCode.useMutation();
  const freezeCodeMutation = trpc.smartlock.freezeAccessCode.useMutation();
  const unfreezeCodeMutation = trpc.smartlock.unfreezeAccessCode.useMutation();

  const handleCreateCode = async () => {
    if (!codeName.trim()) {
      toast.error("Please enter a code name");
      return;
    }

    try {
      const result = await createCodeMutation.mutateAsync({
        name: codeName,
        validityDays,
      });

      if (result.success) {
        toast.success("Access code created successfully");
        setCodeName("");
        setValidityDays(7);
        setIsDialogOpen(false);
        accessCodesQuery.refetch();
      } else {
        toast.error(result.error || "Failed to create access code");
      }
    } catch (error) {
      toast.error("Error creating access code");
    }
  };

  const handleDeleteCode = async (id: number) => {
    if (!confirm("Are you sure you want to delete this access code?")) return;

    try {
      const result = await deleteCodeMutation.mutateAsync({ id });
      if (result.success) {
        toast.success("Access code deleted");
        accessCodesQuery.refetch();
      } else {
        toast.error(result.error || "Failed to delete access code");
      }
    } catch (error) {
      toast.error("Error deleting access code");
    }
  };

  const handleFreezeCode = async (id: number, isFrozen: boolean) => {
    try {
      const result = isFrozen
        ? await unfreezeCodeMutation.mutateAsync({ id })
        : await freezeCodeMutation.mutateAsync({ id });

      if (result.success) {
        toast.success(isFrozen ? "Code unfrozen" : "Code frozen");
        accessCodesQuery.refetch();
      } else {
        toast.error(result.error || "Failed to update code");
      }
    } catch (error) {
      toast.error("Error updating code");
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  const codes = accessCodesQuery.data?.data || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Access Codes</CardTitle>
            <CardDescription>Manage temporary access codes for guests</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Access Code</DialogTitle>
                <DialogDescription>
                  Generate a temporary access code for guest access
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="code-name">Code Name</Label>
                  <Input
                    id="code-name"
                    placeholder="e.g., Guest, Delivery, etc."
                    value={codeName}
                    onChange={(e) => setCodeName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="validity">Valid for (days)</Label>
                  <Input
                    id="validity"
                    type="number"
                    min="1"
                    max="365"
                    value={validityDays}
                    onChange={(e) => setValidityDays(parseInt(e.target.value))}
                  />
                </div>
                <Button onClick={handleCreateCode} className="w-full">
                  Create Code
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {codes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No access codes yet. Create one to share with guests.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-medium">{code.name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {code.code ? code.code.substring(0, 8) + "..." : "N/A"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {code.expireTime
                          ? new Date(code.expireTime).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            code.isFrozen
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}
                        >
                          {code.isFrozen ? "Frozen" : "Active"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyCode(code.code || "")}
                            title="Copy code"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFreezeCode(code.id, code.isFrozen === 1)}
                            title={code.isFrozen ? "Unfreeze" : "Freeze"}
                          >
                            <Lock className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCode(code.id)}
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
