"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Variant = "danger" | "success" | "primary";

interface ConfirmActionDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  variant?: Variant;
}

export default function ConfirmActionDialog({
  open,
  title = "Confirm",
  description = "Are you sure?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onOpenChange,
  variant = "danger",
}: ConfirmActionDialogProps) {
  const confirmClass =
    variant === "danger"
      ? "bg-red-500 hover:bg-red-600"
      : variant === "success"
      ? "bg-green-600 hover:bg-green-700"
      : "bg-blue-600 hover:bg-blue-700";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="mt-2 mb-4">{description}</DialogDescription>
        <DialogFooter>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{cancelLabel}</Button>
            <Button className={`${confirmClass} text-white`} onClick={() => { onConfirm(); }}>
              {confirmLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
