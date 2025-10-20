"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import FileUpload from "@/components/shared/FileUpload"; 
import { updateFormSchema } from "@/lib/yup/schema.validation";
import { supabase } from "@/supabase/client";
import Tables from "@/lib/tables";
import * as yup from "yup";

type UpdateFormData = yup.InferType<typeof updateFormSchema>;


interface AddUpdateDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AddUpdateDialog({ open: controlledOpen, onOpenChange, onSuccess }: AddUpdateDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = typeof controlledOpen === "boolean" ? controlledOpen : internalOpen;
  const setOpen = typeof controlledOpen === "boolean" ? onOpenChange ?? (() => {}) : setInternalOpen;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<UpdateFormData>({
    resolver: yupResolver(updateFormSchema),
  });

  const file = watch("file");

  const onSubmit = async (data: UpdateFormData) => {
    try {
      const filePath = `latest-update/${Date.now()}_${data.file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("AISPPUR")
        .upload(filePath, data.file);

      if (uploadError) throw uploadError;

      // ✅ Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("AISPPUR").getPublicUrl(filePath);

      // ✅ Insert record into database
      const { error: insertError } = await supabase.from(Tables.LatestUpdates).insert([
        {
          title: data.title,
          description: data.description,
          image: publicUrl,
        },
      ]);

      if (insertError) throw insertError;

  toast.success("Update published successfully!");
  reset();
  setOpen(false);
  if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>

      <DialogContent className="sm:max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Add Update</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter title"
              {...register("title")}
              className={`mt-1 ${errors.title ? "border-red-500" : ""}`}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Enter description"
              {...register("description")}
              disabled={isSubmitting}
              className="mt-1"
            />
          </div>

          {/* File Upload */}
          <FileUpload
            label="Upload a file or drag and drop"
            file={file}
            onFileSelect={(selectedFile) => {
              const f = Array.isArray(selectedFile) ? selectedFile[0] : selectedFile;
              if (f) setValue("file", f, { shouldValidate: true });
            }}
            error={errors.file?.message}
            accept="application/pdf, image/*"
            maxSize={10 * 1024 * 1024}
            disabled={isSubmitting}
          />

          {/* Footer */}
          <DialogFooter className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setOpen(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Publishing..." : "Publish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
