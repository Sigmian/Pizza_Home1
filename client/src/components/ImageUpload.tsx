import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

export default function ImageUpload({ value, onChange, className = "" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(value || "");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();

      setPreview(data.url);
      onChange(data.url);
      toast.success("Image uploaded!");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload image");
      setPreview(value || "");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const clearImage = () => {
    setPreview("");
    onChange("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-32 object-cover rounded-xl border border-white/10"
          />

          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
              disabled={uploading}
            >
              <Upload className="w-4 h-4 text-white" />
            </button>

            <button
              type="button"
              onClick={clearImage}
              className="p-2 bg-red-500/50 rounded-lg hover:bg-red-500/70"
              disabled={uploading}
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {uploading && (
            <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full h-32 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-red-500/30 hover:bg-white/[0.02]"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
          ) : (
            <>
              <ImageIcon className="w-6 h-6 text-white/30" />
              <span className="text-xs text-white/30">Click to upload image</span>
              <span className="text-[10px] text-white/20">Max 5MB · JPG, PNG</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}