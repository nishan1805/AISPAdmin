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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const setOpen = typeof controlledOpen === "boolean" ? onOpenChange ?? (() => { }) : setInternalOpen;

  const isEdit = !!(initialData && initialData.id);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<StaffForm>({
    resolver: yupResolver(staffSchema),
    context: { isEdit },
  });

  const file = watch("file");
  const selectedCategory = watch("category");
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [removeExistingFile, setRemoveExistingFile] = useState(false);

  // Prefill form for edit mode
  useEffect(() => {
    console.log("AddStaffDialog useEffect - initialData:", initialData);
    if (initialData) {
      if (initialData.name) setValue("name", initialData.name);
      if (initialData.designation) setValue("designation", initialData.designation);
      if (initialData.category) setValue("category", initialData.category);
      if (initialData.fileUrl) setExistingFileUrl(initialData.fileUrl);
      console.log("Form values set for edit mode");
    } else {
      reset();
      setExistingFileUrl(null);
      setRemoveExistingFile(false);
      console.log("Form reset for create mode");
    }
  }, [initialData, setValue, reset]);

  const onSubmit = async (data: StaffForm) => {
    console.log("Form submitted with data:", data);
    console.log("Initial data:", initialData);

    try {
      let publicUrl: string | null = null;

      // Handle file upload/replacement
      if (data.file) {
        console.log("Uploading new file...");
        const f = Array.isArray(data.file) ? data.file[0] : data.file;
        const filePath = `faculty-staff/${Date.now()}_${f.name}`;

        const { error: uploadError } = await supabase.storage.from("AISPPUR").upload(filePath, f);
        if (uploadError) throw uploadError;

        const { data: { publicUrl: url } } = supabase.storage.from("AISPPUR").getPublicUrl(filePath);
        publicUrl = url;
        console.log("File uploaded successfully:", publicUrl);

        // Remove old file if replacing
        if (existingFileUrl) {
          try {
            const urlParts = existingFileUrl.split("/");
            const possiblePath = urlParts.slice(urlParts.indexOf("AISPPUR") + 1).join("/");
            if (possiblePath) {
              const { error: deleteError } = await supabase.storage.from("AISPPUR").remove([possiblePath]);
              if (deleteError) {
                console.warn("Failed to delete previous file from storage:", deleteError);
              } else {
                console.log("Old file removed successfully");
              }
            }
          } catch (e) {
            console.warn("Failed to delete previous file from storage", e);
          }
        }
      } else if (removeExistingFile && existingFileUrl) {
        // User chose to remove existing file without uploading new one
        try {
          const urlParts = existingFileUrl.split("/");
          const possiblePath = urlParts.slice(urlParts.indexOf("AISPPUR") + 1).join("/");
          if (possiblePath) {
            const { error: deleteError } = await supabase.storage.from("AISPPUR").remove([possiblePath]);
            if (deleteError) {
              console.warn("Failed to delete existing file from storage:", deleteError);
            } else {
              console.log("Existing file removed successfully");
            }
          }
          publicUrl = null; // Set to null to remove from database
        } catch (e) {
          console.warn("Failed to delete existing file from storage", e);
        }
      }

      if (initialData && initialData.id) {
        // Edit flow
        console.log("Updating existing staff...");
        const payload: any = {
          name: data.name,
          designation: data.designation,
          category: data.category,
        };

        // Handle file URL updates
        if (data.file) {
          // New file uploaded
          payload.image_url = publicUrl;
        } else if (removeExistingFile && existingFileUrl) {
          // User chose to remove existing file
          payload.image_url = null;
        }
        // If no file changes, don't update image_url field

        console.log("Update payload:", payload);
        const { error: updateError } = await supabase.from(Tables.FacultyStaff).update(payload).eq("id", initialData.id);
        if (updateError) {
          console.error("Update error:", updateError);
          throw updateError;
        }
        console.log("Staff updated successfully");
        toast.success("Staff updated successfully!");
      } else {
        // Create flow - Generate doc_id
        const { data: existingStaff, error: countError } = await supabase
          .from(Tables.FacultyStaff)
          .select("id", { count: "exact", head: true });

        let docId = "A-1021"; // Default fallback
        if (!countError && existingStaff !== null) {
          // Generate doc_id based on existing count
          const count = Array.isArray(existingStaff) ? existingStaff.length : 0;
          docId = `A-${String(1021 + count).padStart(4, '0')}`;
        }

        const { error: insertError } = await supabase.from(Tables.FacultyStaff).insert([
          {
            doc_id: docId,
            name: data.name,
            designation: data.designation,
            category: data.category,
            image_url: publicUrl,
            visibility: true,
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
            <Select
              value={selectedCategory || ""}
              onValueChange={(value) => setValue("category", value, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Teaching">Teaching</SelectItem>
                <SelectItem value="Non-Teaching">Non-Teaching</SelectItem>
              </SelectContent>
            </Select>
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
              {isSubmitting ? (initialData && initialData.id ? "Updating..." : "Saving...") : (initialData && initialData.id ? "Update Staff" : "Add Staff")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
