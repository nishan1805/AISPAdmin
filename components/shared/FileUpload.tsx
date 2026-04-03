"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFileSelect: (file: File | File[]) => void;
  file?: File | File[];
  multiple?: boolean;
  error?: string;
  accept?: string;
  disabled?: boolean;
  maxSize?: number;
  label?: string;
}

export default function FileUpload({
  onFileSelect,
  file,
  multiple = false,
  error,
  accept = "application/pdf, image/*",
  disabled = false,
  maxSize = 5 * 1024 * 1024,
  label = "Upload a file or drag and drop",
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedFiles = Array.isArray(file) ? file : file ? [file] : [];

  const validateFile = (file: File) => {
    if (maxSize && file.size > maxSize) {
      alert(`File size must be less than ${Math.round(maxSize / (1024 * 1024))} MB`);
      return false;
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    const incomingFiles = Array.from(fileList).filter(validateFile);
    if (!incomingFiles.length) return;

    if (multiple) {
      const existingFiles = Array.isArray(file) ? file : file ? [file] : [];
      onFileSelect([...existingFiles, ...incomingFiles]);
    } else {
      onFileSelect(incomingFiles[0]);
    }

    // Allow selecting the same file again.
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (!droppedFiles.length) return;

    const incomingFiles = droppedFiles.filter(validateFile);
    if (!incomingFiles.length) return;

    if (multiple) {
      const existingFiles = Array.isArray(file) ? file : file ? [file] : [];
      onFileSelect([...existingFiles, ...incomingFiles]);
    } else {
      onFileSelect(incomingFiles[0]);
    }
  };

  return (
    <div className="w-full">
      {label && <p className="text-sm font-medium mb-2 text-gray-800">{label}</p>}

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-7 flex flex-col items-center justify-center text-center cursor-pointer transition 
          ${disabled ? "opacity-60 cursor-not-allowed bg-gray-50" : ""}
          ${error ? "border-red-400 bg-red-50" : "border-blue-300 bg-blue-50/40 hover:border-blue-500 hover:bg-blue-50"}`}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <div className="h-14 w-14 rounded-full bg-white border border-blue-100 shadow-sm flex items-center justify-center mb-3">
          <Upload className="h-8 w-8 text-slate-500" />
        </div>
        {selectedFiles.length === 0 ? (
          <>
            <p className="text-slate-800 font-semibold">{label}</p>
            {multiple && (
              <p className="text-xs text-slate-500 mt-1">
                You can choose 3, 4 or more files at once.
              </p>
            )}
            <p className="text-sm text-slate-500 mt-1">
              {accept.includes("pdf") ? "PDF up to" : "Max"} {Math.round(maxSize / (1024 * 1024))} MB
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 rounded-lg border-blue-200 text-blue-700 hover:bg-blue-100"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Browse Files
            </Button>
          </>
        ) : (
          <div className="w-full max-w-[560px]">
            <p className="text-sm font-semibold text-slate-700 mb-2">
              {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} selected
            </p>
            <div className="space-y-1 max-h-24 overflow-y-auto text-left">
              {selectedFiles.slice(0, 4).map((f, i) => (
                <p key={`${f.name}-${i}`} className="text-slate-700 text-sm truncate">
                  {f.name}
                </p>
              ))}
              {selectedFiles.length > 4 && (
                <p className="text-xs text-slate-500">
                  +{selectedFiles.length - 4} more file(s)
                </p>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">Drop or browse to add more files</p>
            <Button
              type="button"
              variant="outline"
              className="mt-3 rounded-lg border-blue-200 text-blue-700 hover:bg-blue-100"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Add More Files
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          hidden
          disabled={disabled}
          multiple={multiple}
          onChange={handleFileChange}
        />
      </div>

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
}
