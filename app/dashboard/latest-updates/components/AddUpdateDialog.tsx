"use client";

import React, { useState } from "react";
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
import { LatestUpdate } from "@/lib/status";

type UpdateFormData = yup.InferType<typeof updateFormSchema>;


interface AddUpdateDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  // initialData allows the dialog to be used for editing an existing update
  initialData?: {
    id?: string | number;
    title?: string;
    description?: string | null;
    fileUrl?: string | null;
  } | null;
}

export default function AddUpdateDialog({ open: controlledOpen, onOpenChange, onSuccess, initialData = null }: AddUpdateDialogProps) {
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

  const file = watch("file") as File | File[] | undefined | null;

  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [removeExistingFile, setRemoveExistingFile] = useState(false);

  // Prefill form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      if (initialData.title) setValue("title", initialData.title);
      if (initialData.description !== undefined) setValue("description", initialData.description as any);
      if (initialData.fileUrl) setExistingFileUrl(initialData.fileUrl);
    } else {
      // clear when no initial data
      reset();
      setExistingFileUrl(null);
      setRemoveExistingFile(false);
    }
  }, [initialData]);

  const onSubmit = async (data: UpdateFormData) => {
    console.log("AddUpdateDialog onSubmit called", { initialData });
    try {
      let publicUrl: string | null = null;

      // If a new file was provided, upload it
      if (data.file) {
        const f = Array.isArray(data.file) ? data.file[0] : (data.file as any);
        const filePath = `latest-update/${Date.now()}_${f.name}`;

        const { error: uploadError } = await supabase.storage
          .from("AISPPUR")
          .upload(filePath, f);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl: url },
        } = supabase.storage.from("AISPPUR").getPublicUrl(filePath);
        publicUrl = url;

        // if there's an existing file and user is replacing it, try to remove the previous storage object
        if (existingFileUrl) {
          try {
            // attempt to derive path from public url
            const urlParts = existingFileUrl.split("/");
            const possiblePath = urlParts.slice(urlParts.indexOf("AISPPUR") + 1).join("/");
            if (possiblePath) {
              await supabase.storage.from("AISPPUR").remove([possiblePath]);
            }
          } catch (e) {
            // non-fatal
            console.warn("Failed to delete previous file from storage", e);
          }
        }
      }

      if (initialData && initialData.id) {
        console.log("Performing edit flow");
        // Edit flow
        const payload: any = {
          title: data.title,
          description: data.description,
        };
        if (publicUrl) payload.file = publicUrl;
        console.log("Update payload:", payload);

        const { error: updateError } = await supabase.from(Tables.LatestUpdates).update(payload).eq("id", initialData.id);
        if (updateError) throw updateError;
        console.log("Update successful");

        toast.success("Update saved successfully!");
      } else {
        // Create flow
        const { error: insertError } = await supabase.from(Tables.LatestUpdates).insert([
          {
            title: data.title,
            description: data.description,
            file: publicUrl,
            visibility: true,
            status: LatestUpdate.New,
          },
        ]);

        if (insertError) throw insertError;
        toast.success("Update published successfully!");
      }

  reset();
  setExistingFileUrl(null);
  setRemoveExistingFile(false);
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
          <DialogTitle className="text-lg font-semibold">{initialData && initialData.id ? "Edit Update" : "Add Update"}</DialogTitle>
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
          {existingFileUrl && !removeExistingFile ? (
            <div className="space-y-2">
              <div className="text-sm text-slate-700">Existing file:</div>
              <a href={existingFileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">View file</a>
              <div>
                <Button variant="outline" size="sm" onClick={() => setRemoveExistingFile(true)}>Replace file</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <FileUpload
                label="Upload a file or drag and drop"
                file={file ?? undefined}
                onFileSelect={(selectedFile) => {
                  const f = Array.isArray(selectedFile) ? selectedFile[0] : selectedFile;
                  if (f) setValue("file", f, { shouldValidate: true });
                }}
                error={errors.file?.message}
                accept="application/pdf, image/*"
                maxSize={10 * 1024 * 1024}
                disabled={isSubmitting}
              />
              {existingFileUrl && removeExistingFile && (
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // cancel replacing file: revert to existing file and clear any selected file
                      setRemoveExistingFile(false);
                      setValue("file", undefined as any, { shouldValidate: false });
                    }}
                  >
                    Cancel file change
                  </Button>
                </div>
              )}
            </div>
          )}

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
            <Button
              type="submit"
              disabled={isSubmitting}
              onClick={() => {
                handleSubmit(onSubmit)();
              }}
            >
              {isSubmitting
                ? initialData && initialData.id
                  ? "Updating..."
                  : "Publishing..."
                : initialData && initialData.id
                ? "Update"
                : "Publish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
