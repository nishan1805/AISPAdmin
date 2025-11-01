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
import { pdfFileValidation } from "@/lib/yup/schema.helper";

const tcSchema = yupLib.object({
  admissionNo: yupLib.string().required("Admission number is required"),
  studentName: yupLib.string().required("Student name is required"),
  dob: yupLib.string().required("Date of birth is required"),
  description: yupLib.string().nullable(),
  file: pdfFileValidation(10),
});

type TCForm = yupLib.InferType<typeof tcSchema>;

interface AddTCDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: {
    id?: string | number;
    admissionNo?: string;
    studentName?: string;
    dob?: string;
    issueDate?: string;
    fileUrl?: string;
  } | null;
}

export default function AddTCDialog({ open: controlledOpen, onOpenChange, onSuccess, initialData = null }: AddTCDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = typeof controlledOpen === "boolean" ? controlledOpen : internalOpen;
  const setOpen = typeof controlledOpen === "boolean" ? onOpenChange ?? (() => { }) : setInternalOpen;

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<TCForm>({ resolver: yupResolver(tcSchema) });

  const file = watch("file");

  const onSubmit = async (data: TCForm) => {
    try {
      const filePath = `transfer-certificates/${Date.now()}_${data.file.name}`;
      const { error: uploadErr } = await supabase.storage.from("AISPPUR").upload(filePath, data.file);
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from("AISPPUR").getPublicUrl(filePath);

      const { error: insertError } = await supabase.from(Tables.TransferCertificates).insert([
        {
          admission_no: data.admissionNo,
          student_name: data.studentName,
          dob: data.dob,
          description: data.description,
          file_url: publicUrl,
        },
      ]);

      if (insertError) throw insertError;

      toast.success("TC uploaded successfully");
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
          <DialogTitle>Upload TC</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <Label className="text-sm">Admission Number</Label>
            <Input placeholder="Admission Number" {...register("admissionNo")} />
            {errors.admissionNo && <p className="text-red-500 text-sm">{errors.admissionNo.message}</p>}
          </div>

          <div>
            <Label className="text-sm">Student Name</Label>
            <Input placeholder="Student Name" {...register("studentName")} />
            {errors.studentName && <p className="text-red-500 text-sm">{errors.studentName.message}</p>}
          </div>

          <div>
            <Label className="text-sm">Date of Birth (DOB)</Label>
            <Input type="date" {...register("dob")} />
            {errors.dob && <p className="text-red-500 text-sm">{errors.dob.message}</p>}
          </div>

          <div>
            <Label className="text-sm">Description (Optional)</Label>
            <Textarea {...register("description")} />
          </div>

          <FileUpload
            label="Upload a file or drag and drop"
            file={file as any}
            onFileSelect={(selected) => setValue("file", Array.isArray(selected) ? selected[0] : selected as any, { shouldValidate: true })}
            error={errors.file?.message as any}
            accept="application/pdf"
            maxSize={10 * 1024 * 1024}
            disabled={isSubmitting}
          />

          <DialogFooter className="flex justify-end gap-3 pt-4">
            <Button type="button" onClick={() => { reset(); setOpen(false); }} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Uploading..." : "Save & Publish"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
