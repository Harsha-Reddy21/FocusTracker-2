import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AbortSessionDialogProps = {
  open: boolean;
  onClose: () => void;
  onAbort: (reason: string) => void;
};

export function AbortSessionDialog({ open, onClose, onAbort }: AbortSessionDialogProps) {
  const [reason, setReason] = useState("Urgent interruption");

  const handleAbort = () => {
    onAbort(reason);
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Abort Current Session?</AlertDialogTitle>
          <AlertDialogDescription>
            You're about to end your current focus session early. This will be recorded in your session history.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Reason for stopping</label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Urgent interruption">Urgent interruption</SelectItem>
              <SelectItem value="Need a longer break">Need a longer break</SelectItem>
              <SelectItem value="Changing tasks">Changing tasks</SelectItem>
              <SelectItem value="Lost focus">Lost focus</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAbort}
            className="bg-destructive hover:bg-destructive/90"
          >
            Abort Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
