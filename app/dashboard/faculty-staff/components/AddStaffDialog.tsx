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
import { supabase } from "@/supabase/client";
import Tables from "@/lib/tables";
import * as yupLib from "yup";
import { pdfOrImageValidation } from "@/lib/yup/schema.helper";

const staffSchema = yupLib.object({
  name: yupLib.string().required("Name is required"),
  designation: yupLib.string().required("Designation is required"),
  category: yupLib.string().required("Category is required"),
  file: pdfOrImageValidation(10),
});

type StaffForm = yupLib.InferType<typeof staffSchema>;

interface AddStaffDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AddStaffDialog({ open: controlledOpen, onOpenChange, onSuccess }: AddStaffDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = typeof controlledOpen === "boolean" ? controlledOpen : internalOpen;
  const setOpen = typeof controlledOpen === "boolean" ? onOpenChange ?? (() => {}) : setInternalOpen;

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<StaffForm>({ resolver: yupResolver(staffSchema) });

  const file = watch("file");

  const onSubmit = async (data: StaffForm) => {
    try {
      let publicUrl = "";
      if (data.file) {
        const filePath = `faculty-staff/${Date.now()}_${data.file.name}`;
        const { error: uploadErr } = await supabase.storage.from("AISPPUR").upload(filePath, data.file);
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl: url } } = supabase.storage.from("AISPPUR").getPublicUrl(filePath);
        publicUrl = url;
      }

      const { error: insertError } = await supabase.from(Tables.FacultyStaff).insert([
        {
          name: data.name,
          designation: data.designation,
          category: data.category,
          attachment: publicUrl,
        },
      ]);

      if (insertError) throw insertError;

      toast.success("Staff added successfully");
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
          <DialogTitle>Add Staff</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <Label className="text-sm">Name</Label>
            <Input placeholder="Name" {...register("name")} />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>

          <div>
            <Label className="text-sm">Designation</Label>
            <Input placeholder="Designation" {...register("designation")} />
            {errors.designation && <p className="text-red-500 text-sm">{errors.designation.message}</p>}
          </div>

          <div>
            <Label className="text-sm">Category</Label>
            <Input placeholder="Category" {...register("category")} />
            {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
          </div>

          <FileUpload
            label="Upload a file or drag and drop"
            file={file as any}
            onFileSelect={(selected) => setValue("file", Array.isArray(selected) ? selected[0] : selected as any, { shouldValidate: true })}
            error={errors.file?.message as any}
            accept="application/pdf, image/*"
            maxSize={10 * 1024 * 1024}
            disabled={isSubmitting}
          />

          <DialogFooter className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { reset(); setOpen(false); }} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
