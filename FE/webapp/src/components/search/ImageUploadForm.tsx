"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Camera, X } from "lucide-react";

interface ImageUploadFormProps {
  uploadedImage: File | null;
  imagePreview: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
}

export default function ImageUploadForm({
  uploadedImage,
  imagePreview,
  onFileChange,
  onClearImage,
}: ImageUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2 mt-4">
      <label className="text-sm font-medium text-gray-800">
        Image Query
      </label>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload File
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => cameraInputRef.current?.click()}
          className="flex items-center gap-2"
        >
          <Camera className="h-4 w-4" />
          Camera
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFileChange}
        className="hidden"
      />
      {imagePreview && (
        <div className="relative w-32 h-32 border rounded overflow-hidden">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <Button
            variant="outline"
            size="sm"
            className="absolute top-1 right-1 h-6 w-6 p-0"
            onClick={onClearImage}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
