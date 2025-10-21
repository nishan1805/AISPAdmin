"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmActionDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

export default function ConfirmActionDialog({
  open,
  title = "Confirm",
  description = "Are you sure?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onOpenChange,
}: ConfirmActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription>{description}</DialogDescription>
        <DialogFooter className="mt-4">
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{cancelLabel}</Button>
            <Button className="bg-red-500 hover:bg-red-600" onClick={() => { onConfirm(); onOpenChange(false); }}>{confirmLabel}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
