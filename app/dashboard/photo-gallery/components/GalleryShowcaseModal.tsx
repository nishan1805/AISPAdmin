"use client";

import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, ZoomIn, Plus, Upload, MoreVertical } from "lucide-react";
import { Photo } from "./columns";
import { supabase } from "@/supabase/client";
import Tables from "@/lib/tables";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConfirmActionDialog from "@/components/shared/ConfirmActionDialog";

interface GalleryItem {
    id: string;
    title: string;
    eventDate: string;
    images?: string[];
    description?: string;
    source?: string | number;
}

interface GalleryShowcaseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    gallery: GalleryItem | null;
    onSuccess?: () => void;
    tableName?: string; // Make table name configurable
}

export default function GalleryShowcaseModal({
    open,
    onOpenChange,
    gallery: initialGallery,
    onSuccess,
    tableName = Tables.PhotoGallery, // Default to PhotoGallery but allow override
}: GalleryShowcaseModalProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [gallery, setGallery] = useState<GalleryItem | null>(initialGallery);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Delete confirmation state
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<{ url: string; index: number } | null>(null);

    // Update gallery when initialGallery prop changes
    React.useEffect(() => {
        setGallery(initialGallery);
    }, [initialGallery]);

    const images = gallery?.images || [];

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const openLightbox = (index: number) => {
        setCurrentImageIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
    };

    const handleDeleteImage = (imageUrl: string, index: number) => {
        setImageToDelete({ url: imageUrl, index });
        setDeleteConfirmOpen(true);
    };

    const confirmDeleteImage = async () => {
        if (!gallery || !imageToDelete) return;

        try {
            // Delete file from storage
            const success = await deleteFileFromStorage(imageToDelete.url);
            if (!success) {
                throw new Error("Failed to delete image from storage");
            }

            // Update gallery record by removing the image
            const currentImages = gallery.images || [];
            const updatedImages = currentImages.filter((_, idx) => idx !== imageToDelete.index);

            const { error: updateError } = await supabase
                .from(tableName)
                .update({ images: updatedImages })
                .eq("id", gallery.id);

            if (updateError) throw updateError;

            toast.success("Image deleted successfully");

            // Update local gallery state
            setGallery(prev => prev ? {
                ...prev,
                images: updatedImages
            } : null);

            // Also refresh parent component
            if (onSuccess) onSuccess();

        } catch (error: any) {
            console.error("Delete error:", error);
            toast.error(error.message || "Failed to delete image");
        } finally {
            setDeleteConfirmOpen(false);
            setImageToDelete(null);
        }
    };

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
                const storageIndex = urlParts.findIndex((part) => part === "AISPPUR");
                if (storageIndex !== -1 && storageIndex < urlParts.length - 1) {
                    const rawPath = urlParts.slice(storageIndex + 1).join("/");
                    filePath = decodeURIComponent(rawPath); // Decode URL encoding
                }
            }

            if (filePath) {
                console.log("Extracted file path for deletion:", filePath);
                const { error } = await supabase.storage.from("AISPPUR").remove([filePath]);
                if (error) {
                    console.error("Failed to delete file:", filePath, error);
                    return false;
                } else {
                    console.log("Successfully deleted file from storage:", filePath);
                    return true;
                }
            } else {
                console.warn("Could not extract file path from URL:", fileUrl);
                console.log("URL parts:", fileUrl.split("/"));
                return false;
            }
        } catch (e) {
            console.error("Error deleting file from storage", e);
            return false;
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const fileArray = Array.from(files);
            setSelectedFiles(prev => [...prev, ...fileArray]);
        }
    };

    const removeSelectedFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const uploadPhotos = async () => {
        if (!gallery || selectedFiles.length === 0) return;

        setIsUploading(true);
        try {
            const uploadedUrls: string[] = [];

            // Upload each file to Supabase storage
            for (const file of selectedFiles) {
                const folderName = tableName === Tables.PhotoGallery ? 'photo-gallery' : 'news-media';
                const filePath = `${folderName}/${Date.now()}_${file.name}`;
                const { error: uploadError } = await supabase.storage
                    .from("AISPPUR")
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from("AISPPUR")
                    .getPublicUrl(filePath);

                uploadedUrls.push(publicUrl);
            }

            // Update the gallery record with new images
            const currentImages = gallery.images || [];
            const updatedImages = [...currentImages, ...uploadedUrls];

            const { error: updateError } = await supabase
                .from(tableName)
                .update({ images: updatedImages })
                .eq("id", gallery.id);

            if (updateError) throw updateError;

            toast.success(`Successfully added ${selectedFiles.length} photo(s) to the gallery!`);
            setSelectedFiles([]);

            // Refresh the gallery data in the modal immediately
            const { data: updatedGallery, error: fetchError } = await supabase
                .from(tableName)
                .select("*")
                .eq("id", gallery!.id)
                .single();

            if (!fetchError && updatedGallery) {
                // Update the local gallery state with fresh data
                setGallery({
                    id: updatedGallery.id,
                    title: updatedGallery.title,
                    eventDate: updatedGallery.event_date,
                    images: updatedGallery.images || [],
                    description: updatedGallery.description || "",
                    source: updatedGallery.source,
                });
            }

            // Also call onSuccess to refresh the parent component's data
            if (onSuccess) onSuccess();

        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(error.message || "Failed to upload photos");
        } finally {
            setIsUploading(false);
        }
    };

    if (!gallery) return null;

    return (
        <>
            {/* Main Gallery Modal */}
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="w-[95vw] max-w-none lg:w-[60vw] max-h-[90vh] overflow-hidden mx-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">
                            {gallery.title} - {images.length} {gallery.source ? 'Images' : 'Photos'}
                        </DialogTitle>
                        <div className="text-sm text-slate-600 space-y-1">
                            <p>Event Date: {new Date(gallery.eventDate).toLocaleDateString()}</p>
                            {gallery.source && <p>Source: {gallery.source}</p>}
                            {gallery.description && <p className="mt-2">{gallery.description}</p>}
                        </div>

                        {/* Add Photos Button - positioned below the header content */}
                        <div className="flex justify-end mt-4">
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                size="sm"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Photos
                            </Button>
                        </div>

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </DialogHeader>

                    {/* Selected Files Preview and Upload */}
                    {selectedFiles.length > 0 && (
                        <div className="border-t border-slate-200 pt-4 pb-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium text-slate-700">
                                    Selected Photos ({selectedFiles.length})
                                </h3>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => setSelectedFiles([])}
                                        variant="outline"
                                        size="sm"
                                        disabled={isUploading}
                                    >
                                        Clear All
                                    </Button>
                                    <Button
                                        onClick={uploadPhotos}
                                        disabled={isUploading}
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {isUploading ? (
                                            <>Uploading...</>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4 mr-2" />
                                                Upload Photos
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`Selected ${index + 1}`}
                                            className="w-full h-16 object-cover rounded border"
                                        />
                                        <button
                                            onClick={() => removeSelectedFile(index)}
                                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            disabled={isUploading}
                                        >
                                            ×
                                        </button>
                                        <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
                                            {index + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto">
                        {images.length === 0 ? (
                            <div className="flex items-center justify-center h-64 text-slate-500">
                                No images in this gallery
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-4">
                                {images.map((imageUrl, index) => (
                                    <div
                                        key={index}
                                        className="relative group cursor-pointer overflow-hidden rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                                    >
                                        <img
                                            src={imageUrl}
                                            alt={`Gallery image ${index + 1}`}
                                            className="w-full h-24 sm:h-28 md:h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                                            onClick={() => openLightbox(index)}
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                                            <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" size={20} />
                                        </div>

                                        {/* 3-dot menu */}
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 bg-black bg-opacity-50 hover:bg-opacity-70 border-0"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MoreVertical className="h-4 w-4 text-white" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-32">
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteImage(imageUrl, index);
                                                        }}
                                                        className="text-red-600 focus:text-red-600"
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded">
                                            {index + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <ConfirmActionDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title="Delete this image?"
                description="This action cannot be undone. The image will be permanently removed from the gallery."
                confirmLabel="Delete"
                variant="danger"
                onConfirm={confirmDeleteImage}
            />

            {/* Lightbox Modal */}
            {lightboxOpen && images.length > 0 && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-2 sm:p-4">
                    <div className="relative w-full max-w-5xl max-h-full">
                        {/* Close button */}
                        <button
                            onClick={closeLightbox}
                            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 text-white hover:text-slate-300 transition-colors bg-black bg-opacity-50 rounded-full p-1 sm:p-2"
                        >
                            <X size={24} className="sm:w-8 sm:h-8" />
                        </button>

                        {/* Main image */}
                        <img
                            src={images[currentImageIndex]}
                            alt={`Gallery image ${currentImageIndex + 1}`}
                            className="w-full h-auto max-h-full object-contain rounded-lg"
                        />

                        {/* Navigation buttons */}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:text-slate-300 transition-colors bg-black bg-opacity-50 rounded-full p-1 sm:p-2"
                                >
                                    <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:text-slate-300 transition-colors bg-black bg-opacity-50 rounded-full p-1 sm:p-2"
                                >
                                    <ChevronRight size={20} className="sm:w-6 sm:h-6" />
                                </button>
                            </>
                        )}

                        {/* Image counter */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white bg-black bg-opacity-75 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                            {currentImageIndex + 1} / {images.length}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}