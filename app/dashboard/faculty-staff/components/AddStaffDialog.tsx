"use client";

import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import FileUpload from "@/components/shared/FileUpload";
import { supabase } from "@/supabase/client";
import Tables from "@/lib/tables";
import * as yup from "yup";
import { staffSchema } from "@/lib/yup/schema.validation";


type StaffForm = yup.InferType<typeof staffSchema>;

interface AddStaffDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: {
    id?: string | number;
    name?: string;
    designation?: string;
    category?: string;
    fileUrl?: string | null;
  } | null;
}

export default function AddStaffDialog({ open: controlledOpen, onOpenChange, onSuccess, initialData = null }: AddStaffDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = typeof controlledOpen === "boolean" ? controlledOpen : internalOpen;
  const setOpen = typeof controlledOpen === "boolean" ? onOpenChange ?? (() => {}) : setInternalOpen;

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<StaffForm>({
    resolver: yupResolver(staffSchema),
  });

  const file = watch("file");
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [removeExistingFile, setRemoveExistingFile] = useState(false);

  // Prefill form for edit mode
  useEffect(() => {
    if (initialData) {
      if (initialData.name) setValue("name", initialData.name);
      if (initialData.designation) setValue("designation", initialData.designation);
      if (initialData.category) setValue("category", initialData.category);
      if (initialData.fileUrl) setExistingFileUrl(initialData.fileUrl);
    } else {
      reset();
      setExistingFileUrl(null);
      setRemoveExistingFile(false);
    }
  }, [initialData]);

  const onSubmit = async (data: StaffForm) => {
    try {
      let publicUrl: string | null = null;

      if (data.file) {
        const f = Array.isArray(data.file) ? data.file[0] : data.file;
        const filePath = `faculty-staff/${Date.now()}_${f.name}`;

        const { error: uploadError } = await supabase.storage.from("AISPPUR").upload(filePath, f);
        if (uploadError) throw uploadError;

        const { data: { publicUrl: url } } = supabase.storage.from("AISPPUR").getPublicUrl(filePath);
        publicUrl = url;

        // Remove old file if replacing
        if (existingFileUrl) {
          try {
            const urlParts = existingFileUrl.split("/");
            const possiblePath = urlParts.slice(urlParts.indexOf("AISPPUR") + 1).join("/");
            if (possiblePath) await supabase.storage.from("AISPPUR").remove([possiblePath]);
          } catch (e) {
            console.warn("Failed to delete previous file from storage", e);
          }
        }
      }

      if (initialData && initialData.id) {
        // Edit flow
        const payload: any = {
          name: data.name,
          designation: data.designation,
          category: data.category,
        };
        if (publicUrl) payload.image_url = publicUrl;

        const { error: updateError } = await supabase.from(Tables.FacultyStaff).update(payload).eq("id", initialData.id);
        if (updateError) throw updateError;
        toast.success("Staff updated successfully!");
      } else {
        // Create flow
        const { error: insertError } = await supabase.from(Tables.FacultyStaff).insert([
          {
            name: data.name,
            designation: data.designation,
            category: data.category,
            image_url: publicUrl,
          },
        ]);
        if (insertError) throw insertError;
        toast.success("Staff added successfully!");
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
          <DialogTitle>{initialData && initialData.id ? "Edit Staff" : "Add Staff"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <Label className="text-sm">Name</Label>
            <Input placeholder="Name" {...register("name")} disabled={isSubmitting} />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>

          <div>
            <Label className="text-sm">Designation</Label>
            <Input placeholder="Designation" {...register("designation")} disabled={isSubmitting} />
            {errors.designation && <p className="text-red-500 text-sm">{errors.designation.message}</p>}
          </div>

          <div>
            <Label className="text-sm">Category</Label>
            <Input placeholder="Category" {...register("category")} disabled={isSubmitting} />
            {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
          </div>

          {existingFileUrl && !removeExistingFile ? (
            <div className="space-y-2">
              <div className="text-sm text-slate-700">Existing file:</div>
              <a href={existingFileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">View file</a>
              <Button variant="outline" size="sm" onClick={() => setRemoveExistingFile(true)}>Replace file</Button>
            </div>
          ) : (
            <div className="space-y-2">
              <FileUpload
                label="Upload a file or drag and drop"
                file={file as any}
                onFileSelect={(selected) => {
                  const f = Array.isArray(selected) ? selected[0] : selected;
                  if (f) setValue("file", f, { shouldValidate: true });
                }}
                error={errors.file?.message as any}
                accept="application/pdf, image/*"
                maxSize={10 * 1024 * 1024}
                disabled={isSubmitting}
              />
              {existingFileUrl && removeExistingFile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRemoveExistingFile(false);
                    setValue("file", undefined as any, { shouldValidate: false });
                  }}
                >
                  Cancel file change
                </Button>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => { reset(); setOpen(false); }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (initialData && initialData.id ? "Updating..." : "Saving...") : (initialData && initialData.id ? "Update" : "Save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
