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
import { pdfFileValidation } from "@/lib/yup/schema.helper";
import * as yupLib from "yup";
import { LatestUpdate, MandatoryDisclosure } from "@/lib/status";

const disclosureSchema = yupLib.object({
  title: yupLib.string().required("Title is required"),
  description: yupLib.string().nullable(),
  file: pdfFileValidation(10),
});

type DisclosureForm = yupLib.InferType<typeof disclosureSchema>;

interface AddDisclosureDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AddDisclosureDialog({ open: controlledOpen, onOpenChange, onSuccess }: AddDisclosureDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = typeof controlledOpen === "boolean" ? controlledOpen : internalOpen;
  const setOpen = typeof controlledOpen === "boolean" ? onOpenChange ?? (() => {}) : setInternalOpen;

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<DisclosureForm>({ resolver: yupResolver(disclosureSchema) });

  const file = watch("file");

  const onSubmit = async (data: DisclosureForm) => {
    try {
      const filePath = `mandatory-disclosure/${Date.now()}_${data.file.name}`;
      const { error: uploadErr } = await supabase.storage.from("AISPPUR").upload(filePath, data.file);
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from("AISPPUR").getPublicUrl(filePath);

      const { error: insertError } = await supabase.from(Tables.MandatoryDisclosure).insert([
        {
          title: data.title,
          description: data.description,
          file_url: publicUrl,
          visibility: true,
          status:LatestUpdate.New
        },
      ]);

      if (insertError) throw insertError;

      toast.success("Disclosure uploaded successfully");
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
          <DialogTitle>Upload Disclosure</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <Label className="text-sm">Title</Label>
            <Input placeholder="Title" {...register("title")} />
            {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
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
            <Button type="button" variant="outline" onClick={() => { reset(); setOpen(false); }} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Uploading..." : "Create Gallery"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
