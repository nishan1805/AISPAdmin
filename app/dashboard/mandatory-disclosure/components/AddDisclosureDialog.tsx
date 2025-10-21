"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

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

import { supabase } from "@/supabase/client";
import Tables from "@/lib/tables";
import { LatestUpdate } from "@/lib/status";
import { disclosureSchema } from "@/lib/yup/schema.validation";



type DisclosureFormData = yup.InferType<typeof disclosureSchema>;

interface AddDisclosureDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: {
    id?: string | number;
    title?: string;
    description?: string | null;
    fileUrl?: string | null;
  } | null;
}

export default function AddDisclosureDialog({
  open: controlledOpen,
  onOpenChange,
  onSuccess,
  initialData = null,
}: AddDisclosureDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open =
    typeof controlledOpen === "boolean" ? controlledOpen : internalOpen;
  const setOpen =
    typeof controlledOpen === "boolean"
      ? onOpenChange ?? (() => {})
      : setInternalOpen;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<DisclosureFormData>({
    resolver: yupResolver(disclosureSchema),
    context: { isEdit: !!initialData?.id },
  });

  const file = watch("file");
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [removeExistingFile, setRemoveExistingFile] = useState(false);

  // Prefill form when editing
  useEffect(() => {
    if (initialData) {
      if (initialData.title) setValue("title", initialData.title);
      if (initialData.description !== undefined)
        setValue("description", initialData.description as any);
      if (initialData.fileUrl) setExistingFileUrl(initialData.fileUrl);
    } else {
      reset();
      setExistingFileUrl(null);
      setRemoveExistingFile(false);
    }
  }, [initialData]);

  const onSubmit = async (data: DisclosureFormData) => {
    try {
      let publicUrl: string | null = null;

      // Upload new file if provided
      if (data.file) {
        const f = Array.isArray(data.file) ? data.file[0] : (data.file as File);
        const filePath = `mandatory-disclosure/${Date.now()}_${f.name}`;

        const { error: uploadError } = await supabase.storage
          .from("AISPPUR")
          .upload(filePath, f);
        if (uploadError) throw uploadError;

        const {
          data: { publicUrl: url },
        } = supabase.storage.from("AISPPUR").getPublicUrl(filePath);
        publicUrl = url;

        // Try removing old file
        if (existingFileUrl) {
          try {
            const parts = existingFileUrl.split("/");
            const path = parts.slice(parts.indexOf("AISPPUR") + 1).join("/");
            if (path) await supabase.storage.from("AISPPUR").remove([path]);
          } catch (e) {
            console.warn("Could not remove previous file", e);
          }
        }
      }

      if (initialData && initialData.id) {
        // EDIT mode
        const payload: any = {
          title: data.title,
          description: data.description,
        };
        if (publicUrl) payload.file = publicUrl;

        const { error: updateErr } = await supabase
          .from(Tables.MandatoryDisclosure)
          .update(payload)
          .eq("id", initialData.id);
        if (updateErr) throw updateErr;

        toast.success("Disclosure updated successfully!");
      } else {
        // CREATE mode
        const { error: insertErr } = await supabase
          .from(Tables.MandatoryDisclosure)
          .insert([
            {
              title: data.title,
              description: data.description,
              file_url: publicUrl,
              visibility: true,
              status: LatestUpdate.New,
            },
          ]);
        if (insertErr) throw insertErr;
        toast.success("Disclosure uploaded successfully!");
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
          <DialogTitle className="text-lg font-semibold">
            {initialData && initialData.id
              ? "Edit Disclosure"
              : "Add Disclosure"}
          </DialogTitle>
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
              <p className="text-sm text-red-500 mt-1">
                {errors.title.message}
              </p>
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
              <a
                href={existingFileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                View file
              </a>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRemoveExistingFile(true)}
                >
                  Replace file
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <FileUpload
                label="Upload a file or drag and drop"
                file={file ?? undefined}
                onFileSelect={(selected) => {
                  const f = Array.isArray(selected)
                    ? selected[0]
                    : (selected as File);
                  if (f) setValue("file", f, { shouldValidate: true });
                }}
                error={errors.file?.message}
                accept="application/pdf"
                maxSize={10 * 1024 * 1024}
                disabled={isSubmitting}
              />
              {existingFileUrl && removeExistingFile && (
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRemoveExistingFile(false);
                      setValue("file", undefined as any, {
                        shouldValidate: false,
                      });
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
              onClick={() => handleSubmit(onSubmit)()}
            >
              {isSubmitting
                ? initialData && initialData.id
                  ? "Updating..."
                  : "Uploading..."
                : initialData && initialData.id
                ? "Update"
                : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
