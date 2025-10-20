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
import { GalleryFormData, galleryFormSchema } from "@/lib/yup/schema.validation";

interface AddGalleryDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AddGalleryDialog({ open: controlledOpen, onOpenChange, onSuccess }: AddGalleryDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = typeof controlledOpen === "boolean" ? controlledOpen : internalOpen;
  const setOpen = typeof controlledOpen === "boolean" ? onOpenChange ?? (() => {}) : setInternalOpen;

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<GalleryFormData>({ resolver: yupResolver(galleryFormSchema) });

  const files = watch("files");

  const onSubmit = async (data: GalleryFormData) => {
    try {
      // upload each file to AISPPUR under a gallery folder
      const uploadedUrls: string[] = [];
      for (const file of data.files) {
        const filePath = `photo-gallery/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from("AISPPUR").upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("AISPPUR").getPublicUrl(filePath);
        uploadedUrls.push(publicUrl);
      }

      // insert gallery
      const { error: insertError } = await supabase.from(Tables.PhotoGallery).insert([
        {
          title: data.title,
          event_date: data.eventDate,
          description: data.description,
          images: uploadedUrls,
        },
      ]);

      if (insertError) throw insertError;

      toast.success("Gallery created successfully");
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
          <DialogTitle>Add Gallery</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <Label className="text-sm">Album name</Label>
            <Input placeholder="Album name" {...register("title")} />
            {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
          </div>

          <div>
            <Label className="text-sm">Event Date</Label>
            <Input type="date" {...register("eventDate")} />
            {errors.eventDate && <p className="text-red-500 text-sm">{errors.eventDate.message}</p>}
          </div>

          <div>
            <Label className="text-sm">Description (Optional)</Label>
            <Textarea {...register("description")} />
          </div>

          <FileUpload
            label="Drag & drop images here or browse files"
            file={files}
            multiple
            onFileSelect={(selected) => {
              // Always set an array on the form value. Accept a single File or File[] from FileUpload.
              const value = Array.isArray(selected) ? selected : [selected];
              setValue("files", value as any, { shouldValidate: true });
            }}
            error={errors.files?.message as any}
            accept="image/*"
            maxSize={5 * 1024 * 1024}
            disabled={isSubmitting}
          />

          <DialogFooter className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { reset(); setOpen(false); }} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create Gallery"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
