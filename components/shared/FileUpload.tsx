"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFileSelect: (file: File | File[]) => void;
  file?: File | File[];
  multiple?: boolean;
  error?: string;
  accept?: string; // e.g. "application/pdf,image/*"
  disabled?: boolean;
  maxSize?: number; // in bytes, e.g. 10 * 1024 * 1024
  label?: string; // optional label above drop area
}

export default function FileUpload({
  onFileSelect,
  file,
  multiple = false,
  error,
  accept = "application/pdf, image/*",
  disabled = false,
  maxSize = 10 * 1024 * 1024, // default 10 MB
  label = "Upload a file or drag and drop",
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    if (fileList.length === 1) {
      const selectedFile = fileList[0];
      if (validateFile(selectedFile)) onFileSelect(selectedFile);
    } else if (fileList.length > 1) {
      const arr = Array.from(fileList).filter(validateFile);
      if (arr.length) onFileSelect(arr);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (!droppedFiles.length) return;
    if (droppedFiles.length === 1) {
      const f = droppedFiles[0];
      if (validateFile(f)) onFileSelect(f);
    } else {
      const arr = droppedFiles.filter(validateFile);
      if (arr.length) onFileSelect(arr);
    }
  };

  return (
    <div className="w-full">
      {label && <p className="text-sm font-medium mb-2 text-gray-800">{label}</p>}

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition 
          ${disabled ? "opacity-60 cursor-not-allowed bg-gray-50" : ""}
          ${error ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"}`}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Upload className="h-10 w-10 text-gray-500 mb-3" />
        {!file || (Array.isArray(file) && file.length === 0) ? (
          <>
            <p className="text-gray-700 font-medium">{label}</p>
            <p className="text-sm text-gray-500 mt-1">
              {accept.includes("pdf") ? "PDF up to" : "Max"} {Math.round(maxSize / (1024 * 1024))} MB
            </p>
            <Button
              variant="link"
              type="button"
              className="text-indigo-600 mt-1"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
            >
              Browse File
            </Button>
          </>
        ) : (
          Array.isArray(file) ? (
            <div className="space-y-1">
              {file.map((f, i) => (
                <p key={i} className="text-gray-800 font-medium mt-2">{f.name}</p>
              ))}
            </div>
          ) : (
            <p className="text-gray-800 font-medium mt-2">{file.name}</p>
          )
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
