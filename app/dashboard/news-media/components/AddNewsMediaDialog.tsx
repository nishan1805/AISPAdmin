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
import { supabase } from "@/supabase/client";
import Tables from "@/lib/tables";
import { GalleryFormData, galleryFormSchema } from "@/lib/yup/schema.validation";

interface AddNewsMediaDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: {
    id?: string | number;
    title?: string;
    description?: string;
    eventDate?: string;
    source?: string;
    images?: string[];
  } | null;
}

export default function AddNewsMediaDialog({ open: controlledOpen, onOpenChange, onSuccess, initialData = null }: AddNewsMediaDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = typeof controlledOpen === "boolean" ? controlledOpen : internalOpen;
  const setOpen = typeof controlledOpen === "boolean" ? onOpenChange ?? (() => { }) : setInternalOpen;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<GalleryFormData>({
    resolver: yupResolver(galleryFormSchema),
    context: { isEdit: !!initialData?.id }
  });

  const files = watch("files");

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removeExistingImages, setRemoveExistingImages] = useState(false);

  // Prefill form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      if (initialData.title) setValue("title", initialData.title);
      if (initialData.description !== undefined) setValue("description", initialData.description);
      if (initialData.eventDate) setValue("eventDate", initialData.eventDate);
      if (initialData.images) setExistingImages(initialData.images);
    } else {
      // clear when no initial data
      reset();
      setExistingImages([]);
      setRemoveExistingImages(false);
    }
  }, [initialData, setValue, reset]);

  // -------------------- File Deletion Helper --------------------
  const deleteFileFromStorage = async (fileUrl: string): Promise<boolean> => {
    if (!fileUrl) return false;

    try {
      console.log("Attempting to delete file:", fileUrl);

      // Try different methods to extract the file path
      let filePath = "";

      if (fileUrl.includes("/storage/v1/object/public/AISPPUR/")) {
        // Standard Supabase storage URL format
        const parts = fileUrl.split("/storage/v1/object/public/AISPPUR/");
        if (parts.length > 1) {
          filePath = decodeURIComponent(parts[1]); // Decode URL encoding
        }
      } else if (fileUrl.includes("AISPPUR")) {
        // Fallback: extract everything after AISPPUR
        const urlParts = fileUrl.split("/");
        const storageIndex = urlParts.findIndex(part => part === "AISPPUR");
        if (storageIndex !== -1 && storageIndex < urlParts.length - 1) {
          const rawPath = urlParts.slice(storageIndex + 1).join("/");
          filePath = decodeURIComponent(rawPath); // Decode URL encoding
        }
      }

      if (filePath) {
        console.log("Extracted file path:", filePath);

        const { error: deleteError } = await supabase.storage
          .from("AISPPUR")
          .remove([filePath]);

        if (deleteError) {
          console.error("Failed to delete file:", filePath, deleteError);
          return false;
        } else {
          console.log("Successfully deleted file from storage:", filePath);
          return true;
        }
      } else {
        console.warn("Could not extract file path from URL:", fileUrl);
        return false;
      }
    } catch (e) {
      console.error("Failed to delete file from storage", e);
      return false;
    }
  };

  const onSubmit = async (data: GalleryFormData) => {
    console.log("AddNewsMediaDialog onSubmit called", { initialData });
    try {
      let finalImageUrls: string[] = [];
      let shouldDeleteOldImages = false;

      // If new files were provided, upload them
      if (data.files && data.files.length > 0) {
        const uploadedUrls: string[] = [];
        for (const file of data.files) {
          const filePath = `news-media/${Date.now()}_${file.name}`;
          const { error: uploadError } = await supabase.storage.from("AISPPUR").upload(filePath, file);
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage.from("AISPPUR").getPublicUrl(filePath);
          uploadedUrls.push(publicUrl);
        }
        finalImageUrls = uploadedUrls;
        shouldDeleteOldImages = true; // Mark for deletion since we're replacing with new images
      }

      // Check if user explicitly removed existing images (without uploading new ones)
      if (removeExistingImages && (!data.files || data.files.length === 0)) {
        shouldDeleteOldImages = true;
        finalImageUrls = []; // Set to empty array to remove from database
      }

      // Delete old images from storage if needed
      if (shouldDeleteOldImages && existingImages.length > 0) {
        console.log("Deleting existing images:", existingImages);
        let deletedCount = 0;
        for (const imageUrl of existingImages) {
          const success = await deleteFileFromStorage(imageUrl);
          if (success) deletedCount++;
        }
        console.log(`Deleted ${deletedCount}/${existingImages.length} existing images`);
      }

      if (initialData && initialData.id) {
        console.log("Performing edit flow");
        // Edit flow
        const payload: any = {
          title: data.title,
          description: data.description,
          event_date: data.eventDate,
        };

        // Only update images if we have new images or explicitly removing
        if (shouldDeleteOldImages) {
          payload.images = finalImageUrls; // This will be empty array if removing images
        }

        console.log("Update payload:", payload);

        const { error: updateError } = await supabase.from(Tables.NewsMedia).update(payload).eq("id", initialData.id);
        if (updateError) throw updateError;
        console.log("Update successful");

        toast.success("News/Media updated successfully!");
      } else {
        // Create flow
        const { error: insertError } = await supabase.from(Tables.NewsMedia).insert([
          {
            title: data.title,
            event_date: data.eventDate,
            description: data.description,
            images: finalImageUrls,
            visibility: true,
            status: "New",
          },
        ]);

        if (insertError) throw insertError;
        toast.success("News/Media created successfully!");
      }

      reset();
      setExistingImages([]);
      setRemoveExistingImages(false);
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
          <DialogTitle className="text-lg font-semibold">{initialData && initialData.id ? "Edit News/Media" : "Add News/Media"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
          <div>
            <Label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Title"
              {...register("title")}
              className={`mt-1 ${errors.title ? "border-red-500" : ""}`}
              disabled={isSubmitting}
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <Label htmlFor="eventDate" className="text-sm font-medium">
              Event Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="eventDate"
              type="date"
              {...register("eventDate")}
              className={`mt-1 ${errors.eventDate ? "border-red-500" : ""}`}
              disabled={isSubmitting}
            />
            {errors.eventDate && <p className="text-red-500 text-sm mt-1">{errors.eventDate.message}</p>}
          </div>

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

          {/* Image Upload/Display */}
          {existingImages.length > 0 && !removeExistingImages ? (
            <div className="space-y-2">
              <div className="text-sm text-slate-700">Existing images ({existingImages.length}):</div>
              <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                {existingImages.slice(0, 6).map((imageUrl, index) => (
                  <img
                    key={index}
                    src={imageUrl}
                    alt={`News/Media image ${index + 1}`}
                    className="w-full h-16 object-cover rounded border"
                  />
                ))}
                {existingImages.length > 6 && (
                  <div className="w-full h-16 bg-slate-100 rounded border flex items-center justify-center text-xs text-slate-600">
                    +{existingImages.length - 6} more
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => setRemoveExistingImages(true)}
                  disabled={isSubmitting}
                >
                  Replace images
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setRemoveExistingImages(true);
                    setValue("files", [] as any);
                  }}
                  disabled={isSubmitting}
                >
                  Remove images
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
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

              {/* Preview of newly selected images */}
              {files && files.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-slate-700">Selected images ({files.length}):</div>
                  <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                    {files.slice(0, 6).map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Selected image ${index + 1}`}
                          className="w-full h-16 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = files.filter((_, i) => i !== index);
                            setValue("files", newFiles as any, { shouldValidate: true });
                          }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                          disabled={isSubmitting}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {files.length > 6 && (
                      <div className="w-full h-16 bg-slate-100 rounded border flex items-center justify-center text-xs text-slate-600">
                        +{files.length - 6} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {existingImages.length > 0 && removeExistingImages && (
                <div>
                  <Button
                    type="button"
                    onClick={() => {
                      // cancel replacing images: revert to existing images and clear any selected files
                      setRemoveExistingImages(false);
                      setValue("files", [] as any, { shouldValidate: false });
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel image change
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={() => {
                reset();
                setExistingImages([]);
                setRemoveExistingImages(false);
                setOpen(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? initialData && initialData.id
                  ? "Updating..."
                  : "Creating..."
                : initialData && initialData.id
                  ? "Update News/Media"
                  : "Create News/Media"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
