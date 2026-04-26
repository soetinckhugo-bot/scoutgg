"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsLoading(true);

      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setError("Only JPG, PNG, and WebP images are allowed.");
        setIsLoading(false);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("File too large. Max 5MB.");
        setIsLoading(false);
        return;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Upload failed");
        }

        onChange(data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsLoading(false);
      }
    },
    [onChange]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const clearImage = () => {
    onChange("");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <Label>Photo</Label>

      {value ? (
        <div className="relative inline-block">
          <Image
            src={value}
            alt="Preview"
            width={96}
            height={96}
            className="rounded-lg object-cover border border-[#E9ECEF]"
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-[#E94560] text-white flex items-center justify-center hover:bg-red-700 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-6 cursor-pointer text-center transition-colors
            ${isDragging ? "border-[#0F3460] bg-[#F8F9FA]" : "border-[#E9ECEF] hover:border-[#0F3460] hover:bg-[#F8F9FA]"}
          `}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-[#0F3460]" />
              <p className="text-sm text-[#6C757D]">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="h-6 w-6 text-[#6C757D]" />
              <p className="text-sm text-[#6C757D]">
                Click or drag & drop an image here
              </p>
              <p className="text-xs text-[#6C757D]">JPG, PNG, WebP — max 5MB</p>
            </div>
          )}
        </div>
      )}

      <Input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={onInputChange}
        className="hidden"
      />

      {error && <p className="text-xs text-[#E94560]">{error}</p>}
    </div>
  );
}

